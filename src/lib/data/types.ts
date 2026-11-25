import type { ProductCategory } from "@/types/database";

/** Shapes the storefront renders. Built from database rows or demo content. */

export type ProductVariant = {
  id: string;
  label: string;
  pricePaise: number;
  mrpPaise: number | null;
  inStock: boolean;
  isDefault: boolean;
};

export type TitledText = { title: string; body: string };

export type ProductImage = { url: string; alt: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  nameHi: string | null;
  category: ProductCategory;
  shortDesc: string | null;
  description: string | null;
  highlights: TitledText[];
  details: TitledText[];
  badge: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
};

export type Banner = {
  id: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  variant: "primary" | "surface" | "accent";
  imageUrl: string | null;
};

export type Review = {
  id: string;
  customerName: string;
  city: string | null;
  productName: string | null;
  rating: number;
  body: string;
  isFeatured: boolean;
};

/** The variant a one-tap "Add to order" uses: the default, else the first in stock. */
export function defaultVariant(product: Pick<Product, "variants">): ProductVariant | undefined {
  return (
    product.variants.find((v) => v.isDefault && v.inStock) ??
    product.variants.find((v) => v.inStock) ??
    product.variants.at(0)
  );
}
