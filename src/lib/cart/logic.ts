import type { ProductCategory } from "@/types/database";

export const MAX_QUANTITY = 20;

/**
 * A cart line. Price and names are a snapshot for display only; the server
 * re-prices every line from the database when the order is sent.
 */
export type CartLine = {
  variantId: string;
  slug: string;
  productName: string;
  variantLabel: string;
  category: ProductCategory;
  pricePaise: number;
  quantity: number;
};

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(quantity)));
}

/** Adds `quantity` of a line, merging with an existing line for the same variant. */
export function addLine(
  lines: CartLine[],
  line: Omit<CartLine, "quantity">,
  quantity = 1,
): CartLine[] {
  const existing = lines.find((l) => l.variantId === line.variantId);
  if (existing) {
    return setQuantity(lines, line.variantId, existing.quantity + quantity).map((l) =>
      l.variantId === line.variantId ? { ...l, ...line, quantity: l.quantity } : l,
    );
  }
  const q = clampQuantity(quantity);
  return q > 0 ? [...lines, { ...line, quantity: q }] : lines;
}

/** Sets a line's quantity (0–20); 0 removes the line. */
export function setQuantity(lines: CartLine[], variantId: string, quantity: number): CartLine[] {
  const q = clampQuantity(quantity);
  if (q === 0) return lines.filter((l) => l.variantId !== variantId);
  return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l));
}

export function itemCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function subtotalPaise(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.pricePaise * l.quantity, 0);
}

/** Drops malformed lines (e.g. from an older stored cart). */
export function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((l) => {
    if (
      l &&
      typeof l.variantId === "string" &&
      typeof l.slug === "string" &&
      typeof l.productName === "string" &&
      typeof l.variantLabel === "string" &&
      typeof l.category === "string" &&
      Number.isInteger(l.pricePaise) &&
      l.pricePaise > 0
    ) {
      const quantity = clampQuantity(l.quantity);
      return quantity > 0 ? [{ ...l, quantity } as CartLine] : [];
    }
    return [];
  });
}
