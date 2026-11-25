"use client";

import { useState } from "react";
import { CATEGORIES } from "@/content/site";
import type { ProductCategory } from "@/types/database";

/**
 * Category filter chips around the server-rendered product cards. Cards are
 * passed in already rendered, keyed by category, so filtering needs no data
 * on the client.
 */
export function ShopGrid({
  items,
}: {
  items: { id: string; category: ProductCategory; card: React.ReactNode }[];
}) {
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const present = CATEGORIES.filter((c) => items.some((i) => i.category === c.key));
  const shown = category === "all" ? items : items.filter((i) => i.category === category);

  const chip = (active: boolean) =>
    `min-h-11 flex-none rounded-full px-5 text-[15px] font-semibold transition ${
      active ? "bg-primary text-on-primary" : "border border-line text-primary hover:bg-surface"
    }`;

  return (
    <>
      {present.length > 1 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        >
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            className={chip(category === "all")}
          >
            All
          </button>
          {present.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={category === c.key}
              onClick={() => setCategory(c.key)}
              className={chip(category === c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
        {shown.map((item) => (
          <li key={item.id}>{item.card}</li>
        ))}
      </ul>
    </>
  );
}
