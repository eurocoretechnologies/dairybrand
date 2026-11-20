import { describe, expect, it } from "vitest";
import { formatPaise } from "./money";

describe("formatPaise", () => {
  it("formats whole rupees with Indian digit grouping", () => {
    expect(formatPaise(145000)).toBe("₹1,450");
    expect(formatPaise(27500000)).toBe("₹2,75,000");
  });

  it("keeps paise when present", () => {
    expect(formatPaise(9050)).toBe("₹90.5");
    expect(formatPaise(9055)).toBe("₹90.55");
  });

  it("rejects fractional paise", () => {
    expect(() => formatPaise(10.5)).toThrow();
  });
});
