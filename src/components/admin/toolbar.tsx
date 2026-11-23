"use client";

import Form from "next/form";
import { useRef, useState } from "react";
import { RANGE_LABELS, RANGES, type OrderFilters, type RangeKey } from "@/lib/admin/filters";

/** Search, date range and export. Submits as a normal GET form (works without JS). */
export function Toolbar({
  filters,
  today,
  exportHref,
}: {
  filters: OrderFilters;
  today: string;
  exportHref: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [range, setRange] = useState<RangeKey>(filters.range);
  const control = "h-11 rounded-full border border-line bg-ground px-4 text-sm text-ink";

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <Form
        ref={formRef}
        action="/admin"
        className="flex flex-wrap items-end gap-2.5"
        role="search"
      >
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <label className="flex flex-col gap-1">
          <span className="sr-only">Search name, phone or order reference</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.search}
            placeholder="Search name, phone or KS-…"
            className={`${control} w-[min(16rem,80vw)]`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="sr-only">Date range</span>
          <select
            name="range"
            value={range}
            onChange={(e) => {
              const next = e.target.value as RangeKey;
              setRange(next);
              if (next !== "custom") requestAnimationFrame(() => formRef.current?.requestSubmit());
            }}
            className={control}
          >
            {RANGES.map((r) => (
              <option key={r} value={r}>
                {RANGE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" && (
          <>
            <label className="flex flex-col gap-1 text-xs text-muted">
              From
              <input
                type="date"
                name="from"
                required
                max={today}
                defaultValue={filters.from ?? today}
                className={control}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              To
              <input
                type="date"
                name="to"
                required
                max={today}
                defaultValue={filters.to ?? today}
                className={control}
              />
            </label>
          </>
        )}
        <button
          type="submit"
          className="h-11 rounded-full border border-primary px-5 text-sm font-semibold text-primary"
        >
          Apply
        </button>
      </Form>
      <a
        href={exportHref}
        className="flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary"
        download
      >
        Export CSV
      </a>
    </div>
  );
}
