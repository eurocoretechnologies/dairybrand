import type { MetadataRoute } from "next";
import { POLICIES } from "@/content/site";
import { getProducts } from "@/lib/data/products";
import { publicEnv } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const products = await getProducts();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...Object.keys(POLICIES).map((slug) => ({
      url: `${base}/policies/${slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
