import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { OrderDetail } from "@/components/admin/order-detail";
import { adminRepo, requireOwner } from "@/lib/admin/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One order on its own page: used on phones and from the new-order email. */
export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <div className="mx-auto w-full max-w-2xl p-[clamp(16px,3vw,36px)]">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <ChevronLeftIcon size={16} /> All orders
      </Link>
      <div className="mt-2 rounded-[20px] border border-line bg-ground p-5 sm:p-7">
        <Suspense
          fallback={<div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-line/40" />}
        >
          <Order params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Order({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const owner = await requireOwner();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const order = await adminRepo(owner).getOrder(id);
  if (!order) notFound();
  return <OrderDetail order={order} now={new Date()} />;
}
