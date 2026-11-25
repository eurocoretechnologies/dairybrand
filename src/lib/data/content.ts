import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./cache-tags";
import { DEMO_BANNERS, DEMO_REVIEWS, isDemoContentEnabled } from "./demo-content";
import { storageUrl } from "./products";
import type { Banner, Review } from "./types";

/** Banners live right now (row-level security filters by date), in order. */
export async function getLiveBanners(): Promise<Banner[]> {
  "use cache";
  cacheTag(CACHE_TAGS.banners);
  cacheLife({ revalidate: PUBLIC_REVALIDATE_SECONDS });

  const supabase = createPublicClient();
  if (!supabase) return isDemoContentEnabled() ? DEMO_BANNERS : [];

  const { data, error } = await supabase
    .from("banners")
    .select("id, eyebrow, title, body, cta_label, cta_href, theme_variant, image_path")
    .order("sort_order")
    .limit(5);

  if (error) {
    console.error("Could not load banners:", error.message);
    return [];
  }
  return data.map((b) => ({
    id: b.id,
    eyebrow: b.eyebrow,
    title: b.title,
    body: b.body,
    ctaLabel: b.cta_label,
    ctaHref: b.cta_href,
    variant: b.theme_variant,
    imageUrl: b.image_path ? storageUrl(b.image_path) : null,
  }));
}

/** Published reviews: featured first, then newest. */
export async function getPublishedReviews(): Promise<Review[]> {
  "use cache";
  cacheTag(CACHE_TAGS.reviews);
  cacheLife({ revalidate: PUBLIC_REVALIDATE_SECONDS });

  const supabase = createPublicClient();
  if (!supabase) return isDemoContentEnabled() ? DEMO_REVIEWS : [];

  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, city, rating, body, is_featured, product:products(name)")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<
      {
        id: string;
        customer_name: string;
        city: string | null;
        rating: number;
        body: string;
        is_featured: boolean;
        product: { name: string } | null;
      }[]
    >();

  if (error) {
    console.error("Could not load reviews:", error.message);
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    city: r.city,
    productName: r.product?.name ?? null,
    rating: r.rating,
    body: r.body,
    isFeatured: r.is_featured,
  }));
}

export type ReviewSummary = { average: number; count: number };

/** Average rating rounded to one decimal, computed from the reviews shown. */
export function summarizeReviews(reviews: Pick<Review, "rating">[]): ReviewSummary | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}
