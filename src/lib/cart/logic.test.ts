import { describe, expect, it } from "vitest";
import {
  addLine,
  applyCartChanges,
  itemCount,
  sanitizeLines,
  setQuantity,
  subtotalPaise,
  type CartLine,
} from "./logic";

const ghee: Omit<CartLine, "quantity"> = {
  variantId: "v-ghee-500",
  slug: "a2-gir-cow-ghee",
  productName: "A2 Gir Cow Ghee",
  variantLabel: "500 ml",
  category: "ghee",
  pricePaise: 145000,
};
const milk: Omit<CartLine, "quantity"> = {
  variantId: "v-milk",
  slug: "a2-fresh-milk",
  productName: "A2 Fresh Milk",
  variantLabel: "1 L glass",
  category: "milk",
  pricePaise: 11000,
};

describe("cart logic", () => {
  it("adds new lines and merges repeat adds of the same variant", () => {
    let lines = addLine([], ghee);
    lines = addLine(lines, milk, 2);
    lines = addLine(lines, ghee, 3);
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.variantId === ghee.variantId)?.quantity).toBe(4);
    expect(itemCount(lines)).toBe(6);
    expect(subtotalPaise(lines)).toBe(4 * 145000 + 2 * 11000);
  });

  it("caps quantities at 20", () => {
    const lines = addLine(addLine([], ghee, 15), ghee, 10);
    expect(lines.at(0)?.quantity).toBe(20);
    expect(setQuantity(lines, ghee.variantId, 99).at(0)?.quantity).toBe(20);
  });

  it("removes a line when its quantity reaches 0", () => {
    const lines = addLine(addLine([], ghee), milk);
    expect(setQuantity(lines, ghee.variantId, 0).map((l) => l.variantId)).toEqual([milk.variantId]);
  });

  it("refreshes the price snapshot when a variant is added again", () => {
    const lines = addLine(addLine([], ghee), { ...ghee, pricePaise: 150000 });
    expect(lines.at(0)).toMatchObject({ quantity: 2, pricePaise: 150000 });
  });

  it("ignores adds of zero or negative quantity", () => {
    expect(addLine([], ghee, 0)).toEqual([]);
    expect(addLine([], ghee, -3)).toEqual([]);
  });

  it("drops malformed stored lines", () => {
    const stored = [
      { ...ghee, quantity: 2 },
      { ...milk, quantity: 0 },
      { variantId: 1 },
      null,
      { ...ghee, variantId: "x", pricePaise: 10.5, quantity: 1 },
    ];
    expect(sanitizeLines(stored)).toEqual([{ ...ghee, quantity: 2 }]);
    expect(sanitizeLines("nope")).toEqual([]);
  });
});

describe("applyCartChanges", () => {
  it("updates prices and drops unavailable lines", () => {
    const lines = addLine(addLine([], ghee, 2), milk);
    const next = applyCartChanges(lines, [
      { variantId: ghee.variantId, kind: "price", pricePaise: 150000 },
      { variantId: milk.variantId, kind: "unavailable" },
    ]);
    expect(next).toEqual([{ ...ghee, pricePaise: 150000, quantity: 2 }]);
  });
});
