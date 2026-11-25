import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const { toPublicSettings } = await import("./settings");

describe("toPublicSettings", () => {
  it("reads values from settings rows", () => {
    const settings = toPublicSettings(
      [
        { key: "palette", value: "indigo-saffron" },
        { key: "announcement", value: "Hello" },
        { key: "whatsapp_number", value: "919800000000" },
        { key: "batch", value: { number: "014", churned_on: "2026-11-18" } },
        { key: "contact", value: { phone: "+91 98000 00000", email: "hi@example.com" } },
        { key: "fssai_licence", value: "12345678901234" },
      ],
      undefined,
    );
    expect(settings).toEqual({
      palette: "indigo-saffron",
      announcement: "Hello",
      whatsappNumber: "919800000000",
      batch: { number: "014", churnedOn: "2026-11-18" },
      contact: { phone: "+91 98000 00000", email: "hi@example.com", address: null },
      fssaiLicence: "12345678901234",
    });
  });

  it("uses the env fallback, then the default, when the palette is missing or unknown", () => {
    expect(toPublicSettings([], "kesar-pista").palette).toBe("kesar-pista");
    expect(toPublicSettings([], undefined).palette).toBe("peacock-brass");
    expect(toPublicSettings([{ key: "palette", value: "neon" }], undefined).palette).toBe(
      "peacock-brass",
    );
  });

  it("treats blank and wrongly typed values as missing", () => {
    const settings = toPublicSettings(
      [
        { key: "announcement", value: "  " },
        { key: "whatsapp_number", value: 919800000000 },
        { key: "contact", value: "not an object" },
        { key: "batch", value: ["014"] },
      ],
      undefined,
    );
    expect(settings.announcement).toBeNull();
    expect(settings.whatsappNumber).toBeNull();
    expect(settings.batch).toEqual({ number: null, churnedOn: null });
    expect(settings.contact).toEqual({ phone: null, email: null, address: null });
  });

  it("rejects WhatsApp numbers that are not 10–15 digits", () => {
    expect(
      toPublicSettings([{ key: "whatsapp_number", value: "+91 98000" }], undefined).whatsappNumber,
    ).toBeNull();
  });
});
