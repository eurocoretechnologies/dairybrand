/** Compares what the customer saw with current prices and stock. */

export type CurrentVariant = { id: string; pricePaise: number; available: boolean };

export type CartChange =
  | { variantId: string; kind: "price"; pricePaise: number }
  | { variantId: string; kind: "unavailable" };

export function findCartChanges(
  items: { variantId: string; expectedPricePaise: number }[],
  current: CurrentVariant[],
): CartChange[] {
  const byId = new Map(current.map((v) => [v.id, v]));
  const changes: CartChange[] = [];
  for (const item of items) {
    const now = byId.get(item.variantId);
    if (!now || !now.available) {
      changes.push({ variantId: item.variantId, kind: "unavailable" });
    } else if (now.pricePaise !== item.expectedPricePaise) {
      changes.push({ variantId: item.variantId, kind: "price", pricePaise: now.pricePaise });
    }
  }
  return changes;
}
