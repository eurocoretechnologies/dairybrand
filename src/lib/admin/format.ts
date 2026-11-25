const TIME_ZONE = "Asia/Kolkata";

const time = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dayMonth = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});
const longDay = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** "Today, 9:42 am", "Yesterday, 7:50 pm" or "16 Nov, 4:12 pm" (India time). */
export function formatOrderTime(iso: string, now: Date): string {
  const date = new Date(iso);
  const day = isoDay.format(date);
  const today = isoDay.format(now);
  const yesterday = isoDay.format(new Date(now.getTime() - 86_400_000));
  const t = time.format(date).replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toLowerCase()}`);
  if (day === today) return `Today, ${t}`;
  if (day === yesterday) return `Yesterday, ${t}`;
  return `${dayMonth.format(date)}, ${t}`;
}

/** "Monday, 23 November" in India time. */
export function formatLongDay(now: Date): string {
  return longDay.format(now);
}

/** "23 Nov 2026, 9:42 am" for exports. */
export function formatExportTime(iso: string): string {
  const date = new Date(iso);
  return `${isoDay.format(date)} ${time.format(date)}`;
}
