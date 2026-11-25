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

/** Which cache tag each public table feeds. */
const TABLE_TAGS: Record<string, CacheTag> = {
  products: CACHE_TAGS.catalog,
  product_variants: CACHE_TAGS.catalog,
  product_images: CACHE_TAGS.catalog,
  serviceable_pincodes: CACHE_TAGS.catalog,
  banners: CACHE_TAGS.banners,
  reviews: CACHE_TAGS.reviews,
  settings: CACHE_TAGS.settings,
};

/**
 * Reads the tag to refresh from a request body: either `{ "tag": "catalog" }`
 * or a Supabase database webhook payload `{ "table": "products", … }`.
 */
export function tagFromPayload(body: unknown): CacheTag | null {
  if (!body || typeof body !== "object") return null;
  const { tag, table } = body as { tag?: unknown; table?: unknown };
  if (isCacheTag(tag)) return tag;
  if (typeof table === "string" && Object.hasOwn(TABLE_TAGS, table)) return TABLE_TAGS[table];
  return null;
}

/** Public pages refresh at least every 5 minutes (PRD: performance). */
export const PUBLIC_REVALIDATE_SECONDS = 300;
