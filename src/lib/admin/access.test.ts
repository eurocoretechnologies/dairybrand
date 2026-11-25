import { describe, expect, it } from "vitest";
import { isOwnerClaims, safeNextPath } from "./access";

describe("isOwnerClaims", () => {
  it("accepts only app_metadata.role = owner", () => {
    expect(isOwnerClaims({ sub: "u", app_metadata: { role: "owner" } })).toBe(true);
    expect(isOwnerClaims({ sub: "u", app_metadata: { role: "admin" } })).toBe(false);
    // user_metadata can be edited by the user, so it must never count.
    expect(isOwnerClaims({ sub: "u", user_metadata: { role: "owner" } })).toBe(false);
    expect(isOwnerClaims(null)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows dashboard paths", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/orders/abc")).toBe("/admin/orders/abc");
    expect(safeNextPath("/admin?status=new")).toBe("/admin?status=new");
  });

  it("rejects other sites and other pages", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example/admin",
      "/admin//evil",
      "/administrator",
      "/",
      "/admin\\evil",
      42,
    ]) {
      expect(safeNextPath(bad)).toBe("/admin");
    }
  });
});
