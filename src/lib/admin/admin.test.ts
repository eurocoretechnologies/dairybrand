import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";
import { filtersToQuery, istMidnight, istToday, parseFilters, rangeWindow } from "./filters";
import { confirmationMessage } from "./messages";
import { nextStatuses } from "./status";

describe("status rules", () => {
  it("only moves forward, and cancels only before dispatch", () => {
    expect(nextStatuses("new")).toEqual(["confirmed", "cancelled"]);
    expect(nextStatuses("confirmed")).toEqual(["out_for_delivery", "cancelled"]);
    expect(nextStatuses("out_for_delivery")).toEqual(["delivered"]);
    expect(nextStatuses("delivered")).toEqual([]);
    expect(nextStatuses("cancelled")).toEqual([]);
  });
});

describe("filters", () => {
  it("defaults to the last 7 days, page 1", () => {
    expect(parseFilters({})).toEqual({
      status: null,
      search: "",
      range: "7d",
      from: null,
      to: null,
      page: 1,
      orderId: null,
    });
  });

  it("reads valid values and ignores junk", () => {
    const f = parseFilters({
      status: "confirmed",
      q: "  priya ",
      range: "30d",
      page: "3",
      order: "00000000-0000-0000-0000-000000000123",
    });
    expect(f).toMatchObject({ status: "confirmed", search: "priya", range: "30d", page: 3 });
    expect(parseFilters({ status: "shipped", page: "-2", order: "x; drop" })).toMatchObject({
      status: null,
      page: 1,
      orderId: null,
    });
  });

  it("accepts a custom range only with two valid, ordered dates", () => {
    expect(parseFilters({ range: "custom", from: "2026-11-01", to: "2026-11-10" })).toMatchObject({
      range: "custom",
      from: "2026-11-01",
      to: "2026-11-10",
    });
    expect(parseFilters({ range: "custom", from: "2026-11-10", to: "2026-11-01" }).range).toBe(
      "7d",
    );
    expect(parseFilters({ range: "custom", from: "nope", to: "2026-11-01" }).range).toBe("7d");
  });

  it("round-trips through the URL, dropping defaults", () => {
    const f = parseFilters({ status: "new", q: "KS-104", range: "today", page: "2" });
    expect(filtersToQuery(f)).toBe("?status=new&q=KS-104&range=today&page=2");
    expect(filtersToQuery(parseFilters({}))).toBe("");
  });
});

describe("India-time date ranges", () => {
  // 23 Nov 2026, 01:00 in India = 22 Nov 2026, 19:30 UTC.
  const now = new Date("2026-11-22T19:30:00Z");

  it("uses the Indian calendar day", () => {
    expect(istToday(now)).toBe("2026-11-23");
    expect(istMidnight(now).toISOString()).toBe("2026-11-22T18:30:00.000Z");
  });

  it("computes today, 7 days and custom windows", () => {
    expect(rangeWindow({ range: "today", from: null, to: null }, now).from?.toISOString()).toBe(
      "2026-11-22T18:30:00.000Z",
    );
    expect(rangeWindow({ range: "7d", from: null, to: null }, now).from?.toISOString()).toBe(
      "2026-11-16T18:30:00.000Z",
    );
    const custom = rangeWindow({ range: "custom", from: "2026-11-01", to: "2026-11-01" }, now);
    expect(custom.from?.toISOString()).toBe("2026-10-31T18:30:00.000Z");
    expect(custom.to?.toISOString()).toBe("2026-11-01T18:30:00.000Z");
    expect(rangeWindow({ range: "all", from: null, to: null }, now)).toEqual({
      from: null,
      to: null,
    });
  });
});

describe("CSV", () => {
  it("quotes cells and doubles quotes", () => {
    expect(csvCell('B-402, "Shanti"')).toBe('"B-402, ""Shanti"""');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(1450)).toBe('"1450"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+91 98765")).toBe('"\'+91 98765"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
  });

  it("starts with a byte order mark and uses CRLF rows", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe('﻿"a","b"\r\n"1","2"');
  });
});

describe("WhatsApp confirmation message", () => {
  it("lists items, total and slot", () => {
    const text = confirmationMessage({
      reference: "KS-10428",
      customerName: "Priya Deshmukh",
      slot: "morning",
      totalPaise: 167000,
      items: [
        { productName: "A2 Gir Cow Ghee", variantLabel: "500 ml", quantity: 1 },
        { productName: "A2 Fresh Milk", variantLabel: "1 L glass", quantity: 2 },
      ],
    });
    expect(text).toContain("Hi Priya, this is Ksheera. Thank you for your order KS-10428:");
    expect(text).toContain("• A2 Fresh Milk 1 L glass × 2");
    expect(text).toContain("Total: ₹1,670");
    expect(text).toContain("early morning (6:00 – 9:00 am)");
  });
});
