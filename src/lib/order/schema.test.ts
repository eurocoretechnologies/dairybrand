import { describe, expect, it } from "vitest";
import { fieldErrors, normalizePhone, orderRequestSchema, type OrderRequestInput } from "./schema";

const valid: OrderRequestInput = {
  items: [{ variantId: "v1", quantity: 2, expectedPricePaise: 145000 }],
  customerName: "Asha Patil",
  phone: "98765 43210",
  whatsappOk: true,
  email: "",
  addressLine1: "B-402, Shanti Residency",
  addressLine2: "Baner Road, Baner",
  landmark: "",
  pincode: "411 045",
  city: "Pune",
  state: "Maharashtra",
  slot: "morning",
  note: "",
  consent: true,
  website: "",
};

describe("orderRequestSchema", () => {
  it("accepts a valid request and normalises phone, pincode and blanks", () => {
    const result = orderRequestSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      phone: "9876543210",
      pincode: "411045",
      email: undefined,
      landmark: undefined,
      note: undefined,
    });
  });

  it.each([
    ["+91 98765 43210", "9876543210"],
    ["098765-43210", "9876543210"],
    ["9876543210", "9876543210"],
  ])("normalises phone %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("reports one message per invalid field", () => {
    const result = orderRequestSchema.safeParse({
      ...valid,
      items: [],
      customerName: "A",
      phone: "12345",
      email: "not-an-email",
      pincode: "012345",
      state: "Atlantis",
      slot: "midnight",
      consent: false,
    });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(
      ["consent", "customerName", "email", "items", "phone", "pincode", "slot", "state"].sort(),
    );
    expect(errors.phone).toBe("Enter a 10-digit mobile number");
  });

  it("rejects quantities above 20 and notes over 500 characters", () => {
    expect(
      orderRequestSchema.safeParse({
        ...valid,
        items: [{ variantId: "v1", quantity: 21, expectedPricePaise: 100 }],
      }).success,
    ).toBe(false);
    expect(orderRequestSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(orderRequestSchema.safeParse({ ...valid, website: "spam.example" }).success).toBe(false);
  });
});
