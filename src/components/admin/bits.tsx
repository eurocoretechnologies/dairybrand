import { STATUS_LABELS } from "@/lib/admin/status";
import type { OrderStatus, PaymentStatus } from "@/types/database";

const PILL: Record<OrderStatus, string> = {
  new: "bg-accent text-on-accent",
  confirmed: "bg-primary/10 text-primary ring-1 ring-primary/30",
  out_for_delivery: "bg-ground text-ink ring-1 ring-line",
  delivered: "bg-primary text-on-primary",
  cancelled: "bg-line/70 text-muted line-through decoration-1",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold whitespace-nowrap ${PILL[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return status === "paid" ? (
    <span className="text-xs font-semibold text-primary">Paid</span>
  ) : (
    <span className="text-xs text-muted">Unpaid</span>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[20px] border border-line bg-ground ${className}`}>{children}</div>
  );
}
