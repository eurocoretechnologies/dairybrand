"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuantityStepper } from "@/components/cart/cart-lines";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import { useCart } from "@/lib/cart/store";
import { defaultVariant, type Product } from "@/lib/data/types";
import { formatPaise } from "@/lib/money";

/** Size selector, quantity, "Add to order" and "Order now" for one product. */
export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const initial = defaultVariant(product);
  const [variantId, setVariantId] = useState(initial?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? initial;
  if (!variant) return null;
  const available = variant.inStock;

  function addToCart() {
    if (!variant || !available) return;
    add(
      {
        variantId: variant.id,
        slug: product.slug,
        productName: product.name,
        variantLabel: variant.label,
        category: product.category,
        pricePaise: variant.pricePaise,
      },
      quantity,
    );
  }

  const addLabel = justAdded
    ? "Added to your order"
    : `Add to order · ${formatPaise(variant.pricePaise * quantity)}`;

  return (
    <div>
      <div className="mt-7 flex items-baseline gap-3">
        <span className="font-display text-[40px] text-primary">
          {formatPaise(variant.pricePaise)}
        </span>
        {variant.mrpPaise && variant.mrpPaise > variant.pricePaise && (
          <span className="text-muted line-through">
            <span className="sr-only">Was </span>
            {formatPaise(variant.mrpPaise)}
          </span>
        )}
        <span className="text-sm text-muted">incl. of all taxes</span>
      </div>

      {product.variants.length > 1 && (
        <fieldset className="mt-7">
          <legend className="text-[13px] font-semibold tracking-[0.12em] text-muted uppercase">
            Size
          </legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const selected = v.id === variant.id;
              return (
                <label
                  key={v.id}
                  className={`relative flex min-h-[60px] min-w-28 cursor-pointer flex-col justify-center rounded-2xl px-4.5 py-2.5 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                    selected
                      ? "border-2 border-primary bg-primary text-on-primary"
                      : "border border-line bg-ground text-primary hover:border-primary"
                  } ${v.inStock ? "" : "cursor-not-allowed opacity-50"}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={selected}
                    disabled={!v.inStock}
                    onChange={() => {
                      setVariantId(v.id);
                      setJustAdded(false);
                    }}
                    className="sr-only"
                  />
                  <span className="font-bold">{v.label}</span>
                  <span className="mt-0.5 text-[13px] opacity-80">
                    {v.inStock ? formatPaise(v.pricePaise) : "Out of stock"}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!available && (
        <p className="mt-6 rounded-2xl bg-surface p-4 font-semibold text-primary">
          This size is out of stock right now.
        </p>
      )}

      {/* Desktop and tablet actions */}
      <div className="mt-7 flex flex-wrap gap-3 max-sm:hidden">
        <QuantityStepper
          value={quantity}
          min={1}
          size="lg"
          onChange={(q) => {
            setQuantity(Math.max(1, q));
            setJustAdded(false);
          }}
          label={`${product.name} ${variant.label}`}
        />
        <button
          type="button"
          disabled={!available}
          onClick={() => {
            addToCart();
            setJustAdded(true);
          }}
          className={`${buttonStyles.primary} min-h-14 flex-[1_1_220px]`}
        >
          {justAdded && <CheckIcon size={18} />}
          {addLabel}
        </button>
      </div>
      <button
        type="button"
        disabled={!available}
        onClick={() => {
          addToCart();
          router.push("/order");
        }}
        className={`${buttonStyles.accent} mt-3 min-h-14 w-full max-sm:hidden`}
      >
        <WhatsAppIcon />
        Order now, confirm on WhatsApp
      </button>
      {justAdded && (
        <button
          type="button"
          onClick={openCart}
          className="mt-3 text-primary underline max-sm:hidden"
        >
          View your order
        </button>
      )}
      <p className="sr-only" aria-live="polite">
        {justAdded ? `${quantity} × ${product.name} ${variant.label} added to your order.` : ""}
      </p>

      {/* Phone: actions pinned to the bottom of the screen */}
      <div
        data-mobile-actions
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t border-line bg-ground px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:hidden"
      >
        <QuantityStepper
          value={quantity}
          min={1}
          onChange={(q) => {
            setQuantity(Math.max(1, q));
            setJustAdded(false);
          }}
          label={`${product.name} ${variant.label}`}
        />
        <button
          type="button"
          disabled={!available}
          onClick={() => {
            addToCart();
            setJustAdded(true);
            openCart();
          }}
          className={`${buttonStyles.primary} flex-1 px-4`}
        >
          {available ? `Add · ${formatPaise(variant.pricePaise * quantity)}` : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
