import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductRow, ProductVariantRow } from "@/types/database";
import { CACHE_TAGS, PUBLIC_REVALIDATE_SECONDS } from "./cache-tags";

export type CatalogProduct = Pick<
  ProductRow,
  "id" | "slug" | "name" | "name_hi" | "category" | "short_desc" | "badge"
> & {
  variants: Pick<
    ProductVariantRow,
    "id" | "label" | "price_paise" | "mrp_paise" | "in_stock" | "is_default"
  >[];
};

/** Active products with their variants, in display order. */
export async function getCatalog(): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(CACHE_TAGS.catalog);
  cacheLife({ revalidate: PUBLIC_REVALIDATE_SECONDS });

  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, name_hi, category, short_desc, badge, sort_order, " +
        "variants:product_variants(id, label, price_paise, mrp_paise, in_stock, is_default, sort_order)",
    )
    .order("sort_order")
    .returns<(CatalogProduct & { sort_order: number; variants: { sort_order: number }[] })[]>();

  if (error) {
    console.error("Could not load catalogue:", error.message);
    return [];
  }

  return data.map(({ sort_order: _productOrder, variants, ...product }) => ({
    ...product,
    variants: [...variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ sort_order: _variantOrder, ...variant }) => variant),
  }));
}
