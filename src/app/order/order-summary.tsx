"use client";

import Link from "next/link";
import { CartLineRow } from "@/components/cart/cart-lines";
import { buttonStyles } from "@/components/ui";
import { itemCount, subtotalPaise } from "@/lib/cart/logic";
import { useCart, useCartHydrated } from "@/lib/cart/store";
import { formatPaise } from "@/lib/money";

export function OrderSummary() {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);

  if (!hydrated) {
    return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-surface" aria-hidden />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-line bg-surface p-8">
        <p className="text-lg">Your order is empty.</p>
        <Link href="/#shop" className={`${buttonStyles.primary} mt-5`}>
          Browse products
        </Link>
      </div>
    );
  }

  const count = itemCount(lines);
  return (
    <section
      aria-labelledby="summary-heading"
      className="mt-10 max-w-2xl rounded-3xl border border-line bg-ground p-[clamp(20px,3vw,36px)]"
    >
      <h2 id="summary-heading" className="font-display text-2xl text-primary">
        Your products
      </h2>
      <ul className="mt-4">
        {lines.map((line) => (
          <CartLineRow key={line.variantId} line={line} />
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-5">
        <span>
          Estimated total{" "}
          <span className="text-muted">
            ({count} {count === 1 ? "item" : "items"})
          </span>
        </span>
        <span className="font-display text-3xl text-primary">
          {formatPaise(subtotalPaise(lines))}
        </span>
      </div>
      <p className="mt-6 rounded-2xl bg-surface p-4 text-sm">
        The details form (name, phone, address and delivery slot) is coming in the next update.
      </p>
    </section>
  );
}
