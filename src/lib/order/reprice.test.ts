import { describe, expect, it } from "vitest";
import { findCartChanges } from "./reprice";

describe("findCartChanges", () => {
  const current = [
    { id: "ghee", pricePaise: 150000, available: true },
    { id: "milk", pricePaise: 11000, available: true },
    { id: "dahi", pricePaise: 9000, available: false },
  ];

  it("returns nothing when prices and stock match", () => {
    expect(findCartChanges([{ variantId: "milk", expectedPricePaise: 11000 }], current)).toEqual(
      [],
    );
  });

  it("reports changed prices, sold-out and missing variants", () => {
    expect(
      findCartChanges(
        [
          { variantId: "ghee", expectedPricePaise: 145000 },
          { variantId: "milk", expectedPricePaise: 11000 },
          { variantId: "dahi", expectedPricePaise: 9000 },
          { variantId: "gone", expectedPricePaise: 100 },
        ],
        current,
      ),
    ).toEqual([
      { variantId: "ghee", kind: "price", pricePaise: 150000 },
      { variantId: "dahi", kind: "unavailable" },
      { variantId: "gone", kind: "unavailable" },
    ]);
  });
});
