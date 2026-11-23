import type { OrderStatus } from "@/types/database";
import { isOrderStatus } from "./status";

export const PAGE_SIZE = 25;
export const RANGES = ["today", "7d", "30d", "all", "custom"] as const;
export type RangeKey = (typeof RANGES)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
  custom: "Custom",
};

export type OrderFilters = {
  status: OrderStatus | null;
  search: string;
  range: RangeKey;
  /** YYYY-MM-DD, India time, inclusive. Only for range "custom". */
  from: string | null;
  to: string | null;
  page: number;
  /** Order shown in the side panel. */
  orderId: string | null;
};

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const isDate = (v: string | undefined): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseFilters(params: Params): OrderFilters {
  const status = first(params.status);
  const range = first(params.range);
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  const order = first(params.order);
  const from = first(params.from);
  const to = first(params.to);
  const parsedRange = (RANGES as readonly string[]).includes(range ?? "")
    ? (range as RangeKey)
    : "7d";
  const custom = parsedRange === "custom" && isDate(from) && isDate(to) && from <= to;
  return {
    status: isOrderStatus(status) ? status : null,
    search: (first(params.q) ?? "").trim().slice(0, 80),
    range: parsedRange === "custom" && !custom ? "7d" : parsedRange,
    from: custom ? from! : null,
    to: custom ? to! : null,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 10_000) : 1,
    orderId: order && UUID.test(order) ? order : null,
  };
}

/** Builds a dashboard URL from filters, dropping defaults. */
export function filtersToQuery(f: Partial<OrderFilters>): string {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.search) q.set("q", f.search);
  if (f.range && f.range !== "7d") q.set("range", f.range);
  if (f.range === "custom" && f.from && f.to) {
    q.set("from", f.from);
    q.set("to", f.to);
  }
  if (f.page && f.page > 1) q.set("page", String(f.page));
  if (f.orderId) q.set("order", f.orderId);
  const s = q.toString();
  return s ? `?${s}` : "";
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight in India for the given UTC instant, as a UTC Date. */
export function istMidnight(now: Date): Date {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  const midnightShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
  return new Date(midnightShifted - IST_OFFSET_MS);
}

/** Today's date in India as YYYY-MM-DD. */
export function istToday(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The created_at window for a range, in UTC. `null` means open-ended. */
export function rangeWindow(
  f: Pick<OrderFilters, "range" | "from" | "to">,
  now: Date,
): { from: Date | null; to: Date | null } {
  const today = istMidnight(now);
  switch (f.range) {
    case "today":
      return { from: today, to: null };
    case "7d":
      return { from: new Date(today.getTime() - 6 * DAY_MS), to: null };
    case "30d":
      return { from: new Date(today.getTime() - 29 * DAY_MS), to: null };
    case "custom":
      if (f.from && f.to) {
        return {
          from: new Date(Date.parse(`${f.from}T00:00:00Z`) - IST_OFFSET_MS),
          to: new Date(Date.parse(`${f.to}T00:00:00Z`) - IST_OFFSET_MS + DAY_MS),
        };
      }
      return { from: null, to: null };
    case "all":
      return { from: null, to: null };
  }
}
