import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { serverEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { resolvePaletteKey, type PaletteKey } from "@/theme/palettes";
import type { Json } from "@/types/database";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./cache-tags";

export type PublicSettings = {
  palette: PaletteKey;
  announcement: string | null;
  whatsappNumber: string | null;
  batch: { number: string | null; churnedOn: string | null };
};

function asString(value: Json | undefined): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asObject(value: Json | undefined): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/** Builds settings from `settings` rows, falling back to safe defaults. */
export function toPublicSettings(
  rows: { key: string; value: Json }[],
  fallbackPalette: PaletteKey | undefined,
): PublicSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const batch = asObject(byKey.get("batch"));
  return {
    palette: resolvePaletteKey(asString(byKey.get("palette")) ?? fallbackPalette),
    announcement: asString(byKey.get("announcement")),
    whatsappNumber: asString(byKey.get("whatsapp_number")),
    batch: {
      number: asString(batch.number),
      churnedOn: asString(batch.churned_on),
    },
  };
}

/**
 * Public site settings, cached and shared by every visitor. Never throws:
 * if Supabase is unreachable the site still renders with defaults.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife({ revalidate: PUBLIC_REVALIDATE_SECONDS });

  const fallbackPalette = serverEnv().DEFAULT_PALETTE;
  const supabase = createPublicClient();
  if (!supabase) return toPublicSettings([], fallbackPalette);

  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) {
    console.error("Could not load settings:", error.message);
    return toPublicSettings([], fallbackPalette);
  }
  return toPublicSettings(data, fallbackPalette);
}
