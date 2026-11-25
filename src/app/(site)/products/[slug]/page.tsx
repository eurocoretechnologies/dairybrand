import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { artFor, ProductArt } from "@/components/art/product-art";
import { PlusIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { PincodeCheck } from "@/components/product/pincode-check";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { Container, Hindi } from "@/components/ui";
import { BRAND, CATEGORIES, DELIVERY_DETAIL } from "@/content/site";
import { getProductBySlug, getProducts, relatedProducts } from "@/lib/data/products";
import { defaultVariant } from "@/lib/data/types";
import { publicEnv } from "@/lib/env";
import { formatPaise } from "@/lib/money";

/** Cache Components needs at least one param; this one always 404s. */
const NO_PRODUCTS = "__no-products__";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.length > 0 ? products.map((p) => ({ slug: p.slug })) : [{ slug: NO_PRODUCTS }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const variant = defaultVariant(product);
  const description =
    product.shortDesc ??
    `${product.name}${variant ? ` from ${formatPaise(variant.pricePaise)}` : ""}. Order online from ${BRAND.name}.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.images.slice(0, 1).map((img) => ({ url: img.url, alt: img.alt })),
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProductBySlug(slug), getProducts()]);
  if (!product) notFound();

  const related = relatedProducts(all, product);
  const category = CATEGORIES.find((c) => c.key === product.category);
  const details = [...product.details, DELIVERY_DETAIL];
  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL}/products/${product.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description ?? product.shortDesc ?? undefined,
          image: product.images.map((img) => img.url),
          brand: { "@type": "Brand", name: BRAND.name },
          url,
          offers: product.variants.map((v) => ({
            "@type": "Offer",
            name: v.label,
            price: (v.pricePaise / 100).toFixed(2),
            priceCurrency: "INR",
            availability: v.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url,
          })),
        }}
      />

      <Container className="pt-6 text-sm text-muted">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-1.5">
            <li>
              <Link href="/" className="underline-offset-2 hover:underline">
                Home
              </Link>{" "}
              <span aria-hidden>/</span>
            </li>
            <li>
              <Link href="/#shop" className="underline-offset-2 hover:underline">
                {category?.label ?? "Shop"}
              </Link>{" "}
              <span aria-hidden>/</span>
            </li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </Container>

      <Container className="flex flex-wrap items-start gap-[clamp(32px,5vw,72px)] pt-7 pb-24 sm:pb-20">
        <div className="min-w-0 flex-[1_1_460px] lg:sticky lg:top-28">
          <ProductGallery product={product} />
        </div>

        <div className="min-w-0 flex-[1_1_420px]">
          {product.badge && (
            <span className="inline-block rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary">
              {product.badge}
            </span>
          )}
          <h1 className="mt-5 font-display text-[clamp(2.5rem,4.4vw,3.75rem)] leading-[1.05] text-primary">
            {product.name}
          </h1>
          {product.nameHi && (
            <Hindi className="mt-2 block text-xl text-muted">{product.nameHi}</Hindi>
          )}
          {(product.description ?? product.shortDesc) && (
            <p className="mt-5 text-[17px] leading-relaxed">
              {product.description ?? product.shortDesc}
            </p>
          )}

          <ProductPurchase product={product} />
          <PincodeCheck />

          {product.highlights.length > 0 && (
            <ul className="mt-7 grid grid-cols-3 gap-3 text-center text-[13px]">
              {product.highlights.slice(0, 3).map((h) => (
                <li key={h.title} className="rounded-2xl border border-line px-2.5 py-4">
                  <span className="block font-display text-lg text-primary">{h.title}</span>
                  {h.body}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            {details.map((d) => (
              <details key={d.title} className="group border-t border-line last:border-b">
                <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between text-[17px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
                  {d.title}
                  <PlusIcon size={16} className="transition group-open:rotate-45" />
                </summary>
                <p className="mb-5 leading-relaxed">{d.body}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-line bg-surface">
          <Container className="pt-18 pb-28 sm:pb-22">
            <h2
              id="related-heading"
              className="font-display text-[clamp(1.875rem,3.2vw,2.625rem)] text-primary"
            >
              Goes well with
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const v = defaultVariant(r);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/products/${r.slug}`}
                      className="flex items-center gap-4.5 rounded-[20px] border border-line bg-ground p-4 hover:border-primary"
                    >
                      <span className="flex size-19 flex-none items-center justify-center rounded-[14px] bg-surface">
                        <ProductArt kind={artFor(r)} className="h-15 w-15" />
                      </span>
                      <span>
                        <span className="block font-display text-[19px] text-primary">
                          {r.name}
                        </span>
                        {v && (
                          <span className="block text-sm text-muted">
                            {v.label} · {formatPaise(v.pricePaise)}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
