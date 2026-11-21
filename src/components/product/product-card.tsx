import Image from "next/image";
import Link from "next/link";
import { artFor, ProductArt } from "@/components/art/product-art";
import { Hindi } from "@/components/ui";
import { defaultVariant, type Product } from "@/lib/data/types";
import { formatPaise } from "@/lib/money";
import { AddToCartButton } from "./add-to-cart";

const TILE_TINTS = ["bg-surface", "bg-surface/60", "bg-line/50"] as const;

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const variant = defaultVariant(product);
  const image = product.images.at(0);
  const href = `/products/${product.slug}`;

  return (
    <article className="flex flex-col">
      <Link
        href={href}
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-[20px] ${TILE_TINTS[index % TILE_TINTS.length]}`}
        tabIndex={-1}
        aria-hidden
      >
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary">
            {product.badge}
          </span>
        )}
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <ProductArt kind={artFor(product)} className="w-[46%]" />
        )}
      </Link>
      <div className="mt-4 flex flex-col items-start justify-between gap-1 sm:flex-row sm:gap-3">
        <div>
          <h3 className="font-display text-[17px] leading-tight text-primary sm:text-[21px]">
            <Link href={href} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          {product.nameHi && (
            <Hindi className="mt-1 block text-[15px] text-muted">{product.nameHi}</Hindi>
          )}
        </div>
        {variant && (
          <div className="flex items-baseline gap-2 sm:block sm:text-right">
            <div className="font-bold text-primary sm:text-lg">
              {formatPaise(variant.pricePaise)}
            </div>
            <div className="text-[13px] text-muted sm:mt-1">{variant.label}</div>
          </div>
        )}
      </div>
      {variant && (
        <AddToCartButton
          className="mt-4 max-sm:min-h-11 max-sm:px-3 max-sm:text-sm"
          disabled={!variant.inStock}
          line={{
            variantId: variant.id,
            slug: product.slug,
            productName: product.name,
            variantLabel: variant.label,
            category: product.category,
            pricePaise: variant.pricePaise,
          }}
        />
      )}
    </article>
  );
}
