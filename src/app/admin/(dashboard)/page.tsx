import Link from "next/link";
import { Suspense } from "react";
import { Card, PaymentPill, StatusPill } from "@/components/admin/bits";
import { OrderDetail } from "@/components/admin/order-detail";
import { RealtimeOrders } from "@/components/admin/realtime-orders";
import { Toolbar } from "@/components/admin/toolbar";
import { adminRepo, requireOwner } from "@/lib/admin/auth";
import {
  PAGE_SIZE,
  RANGE_LABELS,
  filtersToQuery,
  istToday,
  parseFilters,
  rangeWindow,
  type OrderFilters,
} from "@/lib/admin/filters";
import { formatLongDay, formatOrderTime } from "@/lib/admin/format";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/admin/status";
import type { AdminOrderListItem, OrderStats } from "@/lib/admin/types";
import { formatPaise } from "@/lib/money";

export default function OrdersPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-[clamp(16px,3vw,36px)]" aria-busy="true" aria-label="Loading orders">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-line/60" />
      <div className="mt-6 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[18px] bg-line/50" />
        ))}
      </div>
      <div className="mt-5 h-96 animate-pulse rounded-[20px] bg-line/40" />
    </div>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const owner = await requireOwner();
  const filters = parseFilters(await searchParams);
  const now = new Date();
  const window = rangeWindow(filters, now);
  const repo = adminRepo(owner);

  const [{ orders, hasMore }, stats, selected] = await Promise.all([
    repo.listOrders(filters, window, PAGE_SIZE),
    repo.getStats(window, filters.search),
    filters.orderId ? repo.getOrder(filters.orderId) : Promise.resolve(null),
  ]);
  const { orderId: _selected, ...listFilters } = filters;
  const exportHref = `/admin/export${filtersToQuery({ ...listFilters, page: 1 })}`;

  return (
    <div className="p-[clamp(16px,3vw,36px)]">
      {!owner.demo && <RealtimeOrders />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{formatLongDay(now)}</p>
          <h1 className="mt-1 font-display text-4xl text-primary">Orders</h1>
        </div>
        <Toolbar filters={filters} today={istToday(now)} exportHref={exportHref} />
      </div>

      <StatCards stats={stats} filters={filters} />

      <div className="mt-5 flex flex-wrap items-start gap-5">
        <section
          aria-label="Orders"
          className="min-w-0 flex-[999_1_560px] overflow-hidden rounded-[20px] border border-line bg-ground"
        >
          <StatusTabs stats={stats} filters={filters} />
          {orders.length === 0 ? (
            <p className="p-10 text-center text-muted">
              No orders {filters.search ? `matching “${filters.search}” ` : ""}
              {filters.status ? `with status ${STATUS_LABELS[filters.status].toLowerCase()} ` : ""}
              in this period.
            </p>
          ) : (
            <>
              <OrdersTable orders={orders} filters={filters} now={now} />
              <OrderCards orders={orders} now={now} />
            </>
          )}
          <Pagination filters={filters} hasMore={hasMore} />
        </section>

        <aside
          aria-label="Order details"
          className="hidden min-w-0 flex-[1_1_360px] rounded-[20px] border border-line bg-ground p-6 lg:sticky lg:top-6 lg:block"
        >
          {selected ? (
            <OrderDetail key={selected.id} order={selected} now={now} />
          ) : (
            <p className="py-10 text-center text-muted">
              {filters.orderId ? "That order wasn't found." : "Select an order to see its details."}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatCards({ stats, filters }: { stats: OrderStats; filters: OrderFilters }) {
  const period =
    filters.range === "custom" ? "in this period" : RANGE_LABELS[filters.range].toLowerCase();
  const cards = [
    {
      label: "New requests",
      value: String(stats.openNew),
      sub: stats.openNew ? "Waiting for your call" : "All caught up",
      href: `/admin${filtersToQuery({ ...filters, status: "new", page: 1, orderId: null })}`,
    },
    {
      label: "To deliver",
      value: String(stats.openToDeliver),
      sub: `${stats.openOutForDelivery} out for delivery`,
      href: `/admin${filtersToQuery({ ...filters, status: "confirmed", page: 1, orderId: null })}`,
    },
    {
      label: `Order value, ${period}`,
      value: formatPaise(stats.valuePaise),
      sub: `${stats.valueOrders} ${stats.valueOrders === 1 ? "order" : "orders"}, excl. cancelled`,
    },
    {
      label: "Unpaid (UPI / cash)",
      value: formatPaise(stats.unpaidPaise),
      sub: `${stats.unpaidOrders} ${stats.unpaidOrders === 1 ? "order" : "orders"} to collect`,
    },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
      {cards.map((c) => {
        const body = (
          <>
            <p className="text-[13px] font-semibold text-muted">{c.label}</p>
            <p className="mt-2 font-display text-[clamp(1.6rem,3vw,2.1rem)] leading-none text-primary">
              {c.value}
            </p>
            <p className="mt-2 text-[13px] text-muted">{c.sub}</p>
          </>
        );
        return c.href ? (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-[18px] border border-line bg-ground p-4 hover:border-primary sm:p-5"
          >
            {body}
          </Link>
        ) : (
          <Card key={c.label} className="p-4 sm:p-5">
            {body}
          </Card>
        );
      })}
    </div>
  );
}

function StatusTabs({ stats, filters }: { stats: OrderStats; filters: OrderFilters }) {
  const tabs = [null, ...STATUS_ORDER] as const;
  return (
    <nav
      aria-label="Filter by status"
      className="flex gap-1 overflow-x-auto border-b border-line px-3 pt-3"
    >
      {tabs.map((status) => {
        const active = filters.status === status;
        const count = stats.counts[status ?? "all"];
        return (
          <Link
            key={status ?? "all"}
            href={`/admin${filtersToQuery({ ...filters, status, page: 1, orderId: null })}`}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 flex-none items-center gap-1.5 border-b-2 px-3 text-sm whitespace-nowrap ${
              active
                ? "border-primary font-bold text-primary"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {status ? STATUS_LABELS[status] : "All"}
            <span className="font-normal opacity-75">{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const itemsText = (o: AdminOrderListItem) =>
  o.items.map((i) => `${i.productName} ${i.variantLabel} ×${i.quantity}`).join(", ");

function OrdersTable({
  orders,
  filters,
  now,
}: {
  orders: AdminOrderListItem[];
  filters: OrderFilters;
  now: Date;
}) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[600px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs tracking-[0.08em] text-muted uppercase">
            <th scope="col" className="px-4 py-3.5 font-semibold">
              Order
            </th>
            <th scope="col" className="px-3 py-3.5 font-semibold">
              Customer
            </th>
            <th scope="col" className="px-3 py-3.5 font-semibold">
              Items
            </th>
            <th scope="col" className="hidden px-3 py-3.5 font-semibold 2xl:table-cell">
              Area
            </th>
            <th scope="col" className="px-3 py-3.5 text-right font-semibold">
              Total
            </th>
            <th scope="col" className="px-4 py-3.5 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const selected = o.id === filters.orderId;
            return (
              <tr
                key={o.id}
                className={`border-t border-line ${selected ? "bg-accent/10 shadow-[inset_3px_0_0_var(--brand-accent)]" : "hover:bg-surface/60"}`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin${filtersToQuery({ ...filters, orderId: o.id })}`}
                    aria-current={selected ? "true" : undefined}
                    scroll={false}
                    className="font-bold text-primary underline decoration-line underline-offset-4"
                  >
                    {o.reference}
                  </Link>
                  <span className="block text-xs text-muted">
                    {formatOrderTime(o.createdAt, now)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="block font-semibold">{o.customerName}</span>
                  <span className="block text-xs text-muted">{o.phone}</span>
                </td>
                <td className="max-w-56 px-3 py-3 text-muted">{itemsText(o)}</td>
                <td className="hidden px-3 py-3 text-muted 2xl:table-cell">
                  {o.addressLine2.split(",").at(-1)?.trim()}, {o.pincode}
                  {!o.pincodeServiceable && (
                    <span className="block text-xs font-semibold text-ink">
                      Not on delivery list
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="block font-bold text-primary">{formatPaise(o.totalPaise)}</span>
                  <PaymentPill status={o.paymentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderCards({ orders, now }: { orders: AdminOrderListItem[]; now: Date }) {
  return (
    <ul className="divide-y divide-line lg:hidden">
      {orders.map((o) => (
        <li key={o.id}>
          <Link
            href={`/admin/orders/${o.id}`}
            className="flex flex-col gap-1.5 px-4 py-4 hover:bg-surface/60"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-bold text-primary">{o.reference}</span>
              <StatusPill status={o.status} />
            </span>
            <span className="flex justify-between gap-3">
              <span className="font-semibold">{o.customerName}</span>
              <span className="font-bold text-primary">{formatPaise(o.totalPaise)}</span>
            </span>
            <span className="text-sm text-muted">{itemsText(o)}</span>
            <span className="flex justify-between gap-3 text-xs text-muted">
              <span>
                {formatOrderTime(o.createdAt, now)} · {o.pincode}
                {o.pincodeServiceable ? "" : " (not on list)"}
              </span>
              <PaymentPill status={o.paymentStatus} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Pagination({ filters, hasMore }: { filters: OrderFilters; hasMore: boolean }) {
  if (filters.page === 1 && !hasMore) return null;
  const link = "flex h-11 items-center rounded-full border border-line px-4 text-sm font-semibold";
  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-between border-t border-line px-4 py-3"
    >
      {filters.page > 1 ? (
        <Link
          href={`/admin${filtersToQuery({ ...filters, page: filters.page - 1, orderId: null })}`}
          className={link}
        >
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">Page {filters.page}</span>
      {hasMore ? (
        <Link
          href={`/admin${filtersToQuery({ ...filters, page: filters.page + 1, orderId: null })}`}
          className={link}
        >
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
