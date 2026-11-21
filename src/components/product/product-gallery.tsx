"use client";

import Image from "next/image";
import { useState } from "react";
import { artFor, ProductArt } from "@/components/art/product-art";
import { Hindi } from "@/components/ui";
import { CATEGORIES } from "@/content/site";
import type { Product } from "@/lib/data/types";

/** Product photos with thumbnails, or the illustration until photos exist. */
export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const images = product.images;
  const glyph = CATEGORIES.find((c) => c.key === product.category)?.hindi;

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] bg-surface">
        {glyph && (
          <Hindi className="pointer-events-none absolute top-[6%] text-[clamp(8rem,18vw,16rem)] leading-none text-accent opacity-15">
            {glyph}
          </Hindi>
        )}
        <ProductArt
          kind={artFor(product)}
          label="Ksheera"
          title={product.name}
          className="relative w-[52%]"
        />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative aspect-square overflow-hidden rounded-[28px] bg-surface">
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3.5">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}: ${img.alt}`}
              aria-pressed={i === active}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-surface ${
                i === active ? "outline-2 outline-primary" : ""
              }`}
            >
              <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
