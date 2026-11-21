"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PALETTES, PALETTE_KEYS, isPaletteKey, type PaletteKey } from "@/theme/palettes";

const CHANGE_EVENT = "palette-preview-change";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRequestedPalette(): string | null {
  return new URLSearchParams(window.location.search).get("palette");
}

/**
 * Preview other palettes without a deploy: `?palette=indigo-saffron` or the
 * picker in the corner. Rendered only when NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW
 * is "true" (preview deployments), never in production.
 */
export function PalettePreview({ livePalette }: { livePalette: PaletteKey }) {
  const requested = useSyncExternalStore(subscribe, readRequestedPalette, () => null);
  const palette = isPaletteKey(requested) ? requested : livePalette;

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  function choose(next: PaletteKey) {
    const url = new URL(window.location.href);
    if (next === livePalette) url.searchParams.delete("palette");
    else url.searchParams.set("palette", next);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div
      data-palette-preview
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-line bg-ground py-1 pr-1 pl-1 text-sm text-ink shadow-lg sm:pl-4"
    >
      <label htmlFor="palette-preview" className="max-sm:sr-only">
        Palette preview
      </label>
      <select
        id="palette-preview"
        value={palette}
        onChange={(event) => choose(event.target.value as PaletteKey)}
        className="h-11 rounded-full border border-line bg-surface px-3 text-ink"
      >
        {PALETTE_KEYS.map((key) => (
          <option key={key} value={key}>
            {PALETTES[key].name}
            {key === livePalette ? " (live)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
