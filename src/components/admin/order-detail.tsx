import { WhatsAppIcon } from "@/components/icons";
import { formatOrderTime } from "@/lib/admin/format";
import { confirmationMessage } from "@/lib/admin/messages";
import { PAYMENT_METHOD_LABELS, STATUS_LABELS, isOrderStatus } from "@/lib/admin/status";
import type { AdminOrderDetail, AdminOrderEvent } from "@/lib/admin/types";
import { formatPaise } from "@/lib/money";
import { DELIVERY_SLOTS } from "@/lib/order/schema";
import { whatsappLink } from "@/lib/whatsapp";
import { StatusPill } from "./bits";
import { OwnerNote, PaymentActions, StatusActions } from "./order-actions";

function describeEvent(e: AdminOrderEvent): string {
  const label = (v: string | null) => (v && isOrderStatus(v) ? STATUS_LABELS[v] : (v ?? ""));
  const payment = (v: string | null) => {
    if (!v) return "";
    const [status, method] = v.split(":");
    return status === "paid"
      ? `paid${method && method in PAYMENT_METHOD_LABELS ? ` (${PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS]})` : ""}`
      : "unpaid";
  };
  switch (e.type) {
    case "created":
      return "Order request received from the website";
    case "status":
      return `Status: ${label(e.fromValue)} → ${label(e.toValue)}`;
    case "payment":
      return `Payment marked ${payment(e.toValue)}`;
    case "owner_note":
      return "Note updated";
  }
}

export function OrderDetail({ order, now }: { order: AdminOrderDetail; now: Date }) {
  const slot = DELIVERY_SLOTS.find((s) => s.value === order.slot);
  const message = confirmationMessage(order);
  const whatsapp = whatsappLink(`91${order.phone}`, message);

  return (
    <article aria-labelledby={`order-${order.id}`} className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{formatOrderTime(order.createdAt, now)}</p>
          <h2 id={`order-${order.id}`} className="mt-1 font-display text-[28px] text-primary">
            {order.reference}
          </h2>
        </div>
        <StatusPill status={order.status} />
      </header>

      {!order.pincodeServiceable && (
        <p className="rounded-xl border-2 border-accent bg-accent/15 p-3 text-sm">
          <strong>Pincode {order.pincode} isn&apos;t on your delivery list.</strong> Check you can
          deliver before confirming.
        </p>
      )}

      <section aria-label="Customer" className="rounded-2xl bg-surface p-4">
        <p className="font-bold">{order.customerName}</p>
        <p className="mt-1 text-sm">
          <a href={`tel:+91${order.phone}`} className="underline underline-offset-2">
            +91 {order.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
          </a>
          {order.whatsappOk ? " · on WhatsApp" : " · not on WhatsApp"}
        </p>
        {order.email && (
          <p className="mt-1 text-sm">
            <a href={`mailto:${order.email}`} className="underline underline-offset-2">
              {order.email}
            </a>
          </p>
        )}
        <address className="mt-3 text-sm leading-relaxed not-italic">
          {order.addressLine1}
          <br />
          {order.addressLine2}
          {order.landmark && (
            <>
              <br />
              Landmark: {order.landmark}
            </>
          )}
          <br />
          {order.city} {order.pincode}, {order.state}
        </address>
        <p className="mt-3 text-sm text-muted">
          Slot: {slot ? `${slot.label}, ${slot.time}` : order.slot}
        </p>
      </section>

      {order.note && (
        <section aria-label="Customer note" className="rounded-xl bg-accent/15 px-4 py-3 text-sm">
          <span className="font-semibold">Customer note:</span> “{order.note}”
        </section>
      )}

      <section aria-label="Items">
        <ul className="flex flex-col gap-2.5 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.productName} {item.variantLabel}{" "}
                <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="font-semibold">{formatPaise(item.lineTotalPaise)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-line pt-3 font-bold text-primary">
          <span>Total</span>
          <span>{formatPaise(order.totalPaise)}</span>
        </p>
      </section>

      {order.whatsappOk && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-accent font-bold text-on-accent"
        >
          <WhatsAppIcon /> Message on WhatsApp
        </a>
      )}

      <section aria-label="Status" className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-muted uppercase">Move to</p>
        <StatusActions
          key={`${order.id}-${order.status}`}
          orderId={order.id}
          status={order.status}
        />
        {order.cancelReason && (
          <p className="text-sm text-muted">Cancelled: {order.cancelReason}</p>
        )}
      </section>

      <PaymentActions
        key={`${order.id}-${order.paymentStatus}-${order.paymentMethod}`}
        orderId={order.id}
        paymentStatus={order.paymentStatus}
        paymentMethod={order.paymentMethod}
      />

      <OwnerNote key={order.id} orderId={order.id} ownerNote={order.ownerNote} />

      <button
        type="button"
        disabled
        className="min-h-11 rounded-full border border-dashed border-metal text-sm font-semibold text-muted"
      >
        Create shipment (Shiprocket — coming later)
      </button>

      <section aria-labelledby={`activity-${order.id}`}>
        <h3
          id={`activity-${order.id}`}
          className="text-xs font-bold tracking-[0.12em] text-muted uppercase"
        >
          Activity
        </h3>
        <ol className="mt-3 flex flex-col gap-2.5 border-l border-line pl-4 text-sm">
          {order.events.map((e) => (
            <li key={e.id}>
              <span>{describeEvent(e)}</span>
              <span className="block text-xs text-muted">
                {formatOrderTime(e.createdAt, now)} · {e.byOwner ? "You" : "Website"}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
