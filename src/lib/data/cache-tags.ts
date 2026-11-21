/** Cache tags for public data. Revalidate one with POST /api/revalidate. */
export const CACHE_TAGS = {
  settings: "settings",
  catalog: "catalog",
  banners: "banners",
  reviews: "reviews",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export function isCacheTag(value: unknown): value is CacheTag {
  return (Object.values(CACHE_TAGS) as string[]).includes(value as string);
}

/** Public pages refresh at least every 5 minutes (PRD: performance). */
export const PUBLIC_REVALIDATE_SECONDS = 300;
