"use client";

import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import type { CartLine } from "@/lib/cart/logic";
import { useCart } from "@/lib/cart/store";

export type CartLineInput = Omit<CartLine, "quantity">;

/** One-tap add of a product's default variant, used on product cards. */
export function AddToCartButton({
  line,
  disabled = false,
  className = "",
}: {
  line: CartLineInput;
  disabled?: boolean;
  className?: string;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add(line);
        setAdded(true);
      }}
      className={`${buttonStyles.outline} ${className}`}
    >
      {disabled ? (
        "Out of stock"
      ) : added ? (
        <>
          <CheckIcon size={16} /> Added
        </>
      ) : (
        <>
          <PlusIcon size={16} /> Add to order
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {added ? `${line.productName} ${line.variantLabel} added to your order` : ""}
      </span>
    </button>
  );
}
