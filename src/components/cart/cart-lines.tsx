"use client";

import Link from "next/link";
import { artFor, ProductArt } from "@/components/art/product-art";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { MAX_QUANTITY, type CartLine } from "@/lib/cart/logic";
import { useCart } from "@/lib/cart/store";
import { formatPaise } from "@/lib/money";

export function QuantityStepper({
  value,
  onChange,
  label,
  min = 0,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  /** Names the item, e.g. "A2 Gir Cow Ghee 500 ml". */
  label: string;
  min?: number;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-14" : "h-11";
  return (
    <div className={`flex items-center rounded-full border border-line ${h}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className="flex h-full w-11 items-center justify-center rounded-full text-primary disabled:opacity-40"
      >
        <MinusIcon size={14} />
      </button>
      <span aria-live="polite" className="min-w-6 text-center font-bold text-primary">
        <span className="sr-only">Quantity </span>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={`Increase quantity of ${label}`}
        className="flex h-full w-11 items-center justify-center rounded-full text-primary disabled:opacity-40"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}

export function CartLineRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const label = `${line.productName} ${line.variantLabel}`;

  return (
    <li className="flex items-center gap-3 border-t border-line py-4 first:border-t-0">
      <Link
        href={`/products/${line.slug}`}
        onClick={onNavigate}
        className="flex size-16 flex-none items-center justify-center rounded-2xl bg-surface"
        aria-label={line.productName}
      >
        <ProductArt kind={artFor(line)} className="h-12 w-12" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold text-primary">{line.productName}</span>
        <span className="text-sm text-muted">
          {line.variantLabel} · {formatPaise(line.pricePaise)}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <QuantityStepper
            value={line.quantity}
            min={1}
            onChange={(q) => setQuantity(line.variantId, q)}
            label={label}
          />
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            aria-label={`Remove ${label}`}
            className="flex size-11 items-center justify-center rounded-full text-muted hover:text-primary"
          >
            <TrashIcon size={18} />
          </button>
        </div>
      </div>
      <span className="self-start font-bold text-primary">
        {formatPaise(line.pricePaise * line.quantity)}
      </span>
    </li>
  );
}
