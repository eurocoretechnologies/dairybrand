"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BagIcon, CloseIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import { itemCount, subtotalPaise } from "@/lib/cart/logic";
import { useCart, useCartHydrated } from "@/lib/cart/store";
import { formatPaise } from "@/lib/money";
import { CartLineRow } from "./cart-lines";

/** Slide-in cart, opened from the header or after adding a product. */
export function CartDrawer() {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const count = itemCount(lines);

  return (
    <dialog
      ref={ref}
      aria-labelledby="cart-title"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md bg-ground p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl text-primary">
            Your order
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close your order"
            className="flex size-11 items-center justify-center rounded-full text-primary hover:bg-surface"
          >
            <CloseIcon />
          </button>
        </div>

        {hydrated && lines.length > 0 ? (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {lines.map((line) => (
                <CartLineRow key={line.variantId} line={line} onNavigate={close} />
              ))}
            </ul>
            <div className="border-t border-line px-5 pt-4 pb-6">
              <div className="flex items-baseline justify-between">
                <span>
                  Estimated total{" "}
                  <span className="text-muted">
                    ({count} {count === 1 ? "item" : "items"})
                  </span>
                </span>
                <span className="font-display text-2xl text-primary">
                  {formatPaise(subtotalPaise(lines))}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                No payment now. Delivery and payment are confirmed on WhatsApp.
              </p>
              <Link href="/order" onClick={close} className={`${buttonStyles.primary} mt-4 w-full`}>
                Continue to your details
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-surface text-primary">
              <BagIcon size={28} />
            </span>
            <p className="text-lg">Your order is empty.</p>
            <Link href="/#shop" onClick={close} className={buttonStyles.outline}>
              Browse products
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}

/** Header button showing the item count. */
export function CartButton() {
  const hydrated = useCartHydrated();
  const count = useCart((s) => itemCount(s.lines));
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Your order, ${shown} ${shown === 1 ? "item" : "items"}`}
      className="relative flex size-11 items-center justify-center rounded-full border border-line text-primary hover:bg-surface"
    >
      <BagIcon />
      {shown > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent">
          {shown}
        </span>
      )}
    </button>
  );
}
