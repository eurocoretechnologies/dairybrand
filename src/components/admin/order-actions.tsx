"use client";

import { useState, useTransition } from "react";
import {
  saveOwnerNote,
  updateOrderPayment,
  updateOrderStatus,
  type ActionResult,
} from "@/app/admin/actions";
import { PAYMENT_METHOD_LABELS, STATUS_ACTIONS, nextStatuses } from "@/lib/admin/status";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/types/database";

type Props = {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  ownerNote: string | null;
};

function useAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const run = (work: () => Promise<ActionResult>, okText: string) =>
    start(async () => {
      setMessage(null);
      const result = await work();
      setMessage(result.ok ? { kind: "ok", text: okText } : { kind: "error", text: result.error });
    });
  return { pending, message, run };
}

function Feedback({ message }: { message: { kind: "error" | "ok"; text: string } | null }) {
  return (
    <p
      aria-live="polite"
      className={`text-sm empty:hidden ${message?.kind === "error" ? "font-semibold text-primary" : "text-muted"}`}
    >
      {message ? (message.kind === "error" ? `! ${message.text}` : message.text) : ""}
    </p>
  );
}

export function StatusActions({ orderId, status }: Pick<Props, "orderId" | "status">) {
  const { pending, message, run } = useAction();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const options = nextStatuses(status);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted">
        {status === "delivered" ? "This order is complete." : "This order was cancelled."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {options.map((next) => {
          const cancel = next === "cancelled";
          return (
            <button
              key={next}
              type="button"
              disabled={pending}
              aria-expanded={cancel ? cancelling : undefined}
              onClick={() =>
                cancel
                  ? setCancelling((c) => !c)
                  : run(() => updateOrderStatus({ orderId, status: next }), "Status updated.")
              }
              className={
                cancel
                  ? "min-h-11 rounded-xl border border-line bg-ground px-3 text-sm font-semibold text-muted hover:text-ink disabled:opacity-50"
                  : "min-h-11 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary disabled:opacity-50"
              }
            >
              {STATUS_ACTIONS[next]}
            </button>
          );
        })}
      </div>
      {cancelling && (
        <form
          className="flex flex-col gap-2 rounded-xl bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => updateOrderStatus({ orderId, status: "cancelled", cancelReason: reason }),
              "Order cancelled.",
            );
          }}
        >
          <label htmlFor={`cancel-${orderId}`} className="text-sm font-semibold">
            Why is it being cancelled?
          </label>
          <input
            id={`cancel-${orderId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
            maxLength={300}
            placeholder="e.g. Customer asked to cancel on WhatsApp"
            className="h-11 rounded-lg border border-line bg-ground px-3 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded-lg bg-ink px-4 text-sm font-semibold text-ground disabled:opacity-50"
            >
              Confirm cancellation
            </button>
            <button
              type="button"
              onClick={() => setCancelling(false)}
              className="min-h-11 px-3 text-sm underline"
            >
              Keep order
            </button>
          </div>
        </form>
      )}
      <Feedback message={message} />
    </div>
  );
}

export function PaymentActions({
  orderId,
  paymentStatus,
  paymentMethod,
}: Pick<Props, "orderId" | "paymentStatus" | "paymentMethod">) {
  const { pending, message, run } = useAction();
  const options: { label: string; status: PaymentStatus; method: PaymentMethod | null }[] = [
    { label: "Unpaid", status: "unpaid", method: null },
    ...(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => ({
      label: `Paid · ${PAYMENT_METHOD_LABELS[m]}`,
      status: "paid" as const,
      method: m,
    })),
  ];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-bold tracking-[0.12em] text-muted uppercase">
        Payment
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active =
            o.status === paymentStatus && (o.status === "unpaid" || o.method === paymentMethod);
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={active}
              disabled={pending || active}
              onClick={() =>
                run(
                  () =>
                    updateOrderPayment({
                      orderId,
                      paymentStatus: o.status,
                      paymentMethod: o.method,
                    }),
                  "Payment updated.",
                )
              }
              className={`min-h-10 rounded-full px-3.5 text-sm font-semibold ${
                active
                  ? "bg-primary text-on-primary"
                  : "border border-line bg-ground text-ink hover:border-primary"
              } disabled:cursor-default`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <Feedback message={message} />
    </fieldset>
  );
}

export function OwnerNote({ orderId, ownerNote }: Pick<Props, "orderId" | "ownerNote">) {
  const { pending, message, run } = useAction();
  const [note, setNote] = useState(ownerNote ?? "");
  const changed = note.trim() !== (ownerNote ?? "");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveOwnerNote({ orderId, note }), "Note saved.");
      }}
    >
      <label
        htmlFor={`note-${orderId}`}
        className="text-xs font-bold tracking-[0.12em] text-muted uppercase"
      >
        Your note (only you see this)
      </label>
      <textarea
        id={`note-${orderId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="e.g. Called, will deliver Thursday morning"
        className="rounded-xl border border-line bg-ground px-3 py-2.5 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !changed}
          className="min-h-10 rounded-full border border-primary px-4 text-sm font-semibold text-primary disabled:opacity-40"
        >
          Save note
        </button>
        <Feedback message={message} />
      </div>
    </form>
  );
}
