import { BannerSlideshow } from "@/components/home/banner-slideshow";
import {
  CategoryStrip,
  ComparisonSection,
  FaqSection,
  Hero,
  OrderingSteps,
  ProcessSection,
  ReviewsSection,
  StorySection,
} from "@/components/home/sections";
import { ShopGrid } from "@/components/home/shop-grid";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product/product-card";
import { Container, Eyebrow, SectionHeading } from "@/components/ui";
import { BRAND } from "@/content/site";
import { getLiveBanners, getPublishedReviews, summarizeReviews } from "@/lib/data/content";
import { getProducts } from "@/lib/data/products";
import { getPublicSettings } from "@/lib/data/settings";
import { publicEnv } from "@/lib/env";

export default async function HomePage() {
  const [settings, products, banners, reviews] = await Promise.all([
    getPublicSettings(),
    getProducts(),
    getLiveBanners(),
    getPublishedReviews(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: BRAND.name,
          url: publicEnv.NEXT_PUBLIC_SITE_URL,
          ...(settings.contact.email && { email: settings.contact.email }),
          ...(settings.contact.phone && { telephone: settings.contact.phone }),
        }}
      />
      <Hero batch={settings.batch} />
      <BannerSlideshow banners={banners} />
      <CategoryStrip />

      <section id="shop" aria-labelledby="shop-heading" className="scroll-mt-24">
        <Container className="py-[clamp(64px,8vw,120px)]">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow className="text-muted">From our dairy</Eyebrow>
              <SectionHeading id="shop-heading" className="mt-3.5 text-primary">
                Made this week,
                <br />
                at your door next.
              </SectionHeading>
            </div>
            <p className="max-w-[380px] leading-relaxed">
              Everything is made to order in small quantities. Add what you like — we&apos;ll
              confirm availability and delivery with you.
            </p>
          </div>
          {products.length > 0 ? (
            <ShopGrid
              items={products.map((product, i) => ({
                id: product.id,
                category: product.category,
                card: <ProductCard product={product} index={i} />,
              }))}
            />
          ) : (
            <p className="mt-10 rounded-2xl border border-line bg-surface p-6 text-muted">
              Our products will be listed here soon.
            </p>
          )}
        </Container>
      </section>

      <ProcessSection />
      <StorySection />
      <ComparisonSection />
      <ReviewsSection reviews={reviews} summary={summarizeReviews(reviews)} />
      <OrderingSteps />
      <FaqSection />
    </>
  );
}
