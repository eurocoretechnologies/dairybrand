import { describe, expect, it } from "vitest";
import { tagFromPayload } from "./cache-tags";

describe("tagFromPayload", () => {
  it("accepts an explicit tag", () => {
    expect(tagFromPayload({ tag: "catalog" })).toBe("catalog");
    expect(tagFromPayload({ tag: "settings" })).toBe("settings");
  });

  it("maps Supabase webhook payloads by table", () => {
    expect(tagFromPayload({ type: "UPDATE", table: "product_variants", schema: "public" })).toBe(
      "catalog",
    );
    expect(tagFromPayload({ type: "INSERT", table: "banners" })).toBe("banners");
    expect(tagFromPayload({ table: "reviews" })).toBe("reviews");
  });

  it("rejects unknown tags, private tables and junk", () => {
    expect(tagFromPayload({ tag: "orders" })).toBeNull();
    expect(tagFromPayload({ table: "orders" })).toBeNull();
    expect(tagFromPayload({ table: "toString" })).toBeNull();
    expect(tagFromPayload(null)).toBeNull();
    expect(tagFromPayload("catalog")).toBeNull();
  });
});
