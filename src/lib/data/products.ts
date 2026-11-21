import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicEnv } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Json, ProductCategory } from "@/types/database";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./cache-tags";
import { DEMO_PRODUCTS, isDemoContentEnabled } from "./demo-content";
import type { Product, TitledText } from "./types";

export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Public URL of a file in the product-images bucket. */
export function storageUrl(path: string): string {
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${clean}`;
}

export function toTitledText(value: Json): TitledText[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { title, body } = item;
    return typeof title === "string" && typeof body === "string" && title && body
      ? [{ title, body }]
      : [];
  });
}

type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  name_hi: string | null;
  category: ProductCategory;
  short_desc: string | null;
  description: string | null;
  highlights: Json;
  details: Json;
  badge: string | null;
  variants: {
    id: string;
    label: string;
    price_paise: number;
    mrp_paise: number | null;
    in_stock: boolean;
    is_default: boolean;
    sort_order: number;
  }[];
  images: { storage_path: string; alt: string; sort_order: number }[];
};

const bySortOrder = (a: { sort_order: number }, b: { sort_order: number }) =>
  a.sort_order - b.sort_order;

export function toProduct(row: ProductQueryRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameHi: row.name_hi,
    category: row.category,
    shortDesc: row.short_desc,
    description: row.description,
    highlights: toTitledText(row.highlights),
    details: toTitledText(row.details),
    badge: row.badge,
    variants: [...row.variants].sort(bySortOrder).map((v) => ({
      id: v.id,
      label: v.label,
      pricePaise: v.price_paise,
      mrpPaise: v.mrp_paise,
      inStock: v.in_stock,
      isDefault: v.is_default,
    })),
    images: [...row.images]
      .sort(bySortOrder)
      .map((img) => ({ url: storageUrl(img.storage_path), alt: img.alt })),
  };
}

/** Every active product with variants and images, in display order. */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag(CACHE_TAGS.catalog);
  cacheLife({ revalidate: PUBLIC_REVALIDATE_SECONDS });

  const supabase = createPublicClient();
  if (!supabase) return isDemoContentEnabled() ? DEMO_PRODUCTS : [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, name_hi, category, short_desc, description, highlights, details, badge, " +
        "variants:product_variants(id, label, price_paise, mrp_paise, in_stock, is_default, sort_order), " +
        "images:product_images(storage_path, alt, sort_order)",
    )
    .order("sort_order")
    .returns<ProductQueryRow[]>();

  if (error) {
    console.error("Could not load products:", error.message);
    return [];
  }
  return data.filter((row) => row.variants.length > 0).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

/** Up to `limit` other products, same category first. */
export function relatedProducts(all: Product[], product: Product, limit = 3): Product[] {
  const others = all.filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, limit);
}
