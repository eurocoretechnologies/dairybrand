import { getCatalog } from "@/lib/data/catalog";
import { getPublicSettings } from "@/lib/data/settings";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPaise } from "@/lib/money";

/**
 * Phase 1 placeholder. It proves the palette tokens, fonts and the Supabase
 * catalogue read work end to end. The full home page arrives in phase 2.
 */
export default async function Home() {
  const [settings, catalog] = await Promise.all([getPublicSettings(), getCatalog()]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16 sm:px-10">
      {settings.announcement && (
        <p className="rounded-full bg-primary px-5 py-2 text-center text-sm text-on-primary">
          {settings.announcement}
        </p>
      )}

      <section className="flex flex-col gap-6">
        <p className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">
          A2 Gir cow · Bilona method
        </p>
        <h1 className="font-display text-5xl leading-[1.02] text-primary sm:text-7xl">
          Slow-churned.
          <br />
          Never rushed.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed">
          Our new store is on its way. Ghee, milk and fresh dairy from free-grazing Gir cows — set
          in clay, churned by hand, slow-heated over a wood fire.
        </p>
        <p className="font-deva text-2xl text-muted" lang="hi">
          शुद्ध · घी · दूध
        </p>
      </section>

      <section aria-labelledby="catalog-heading" className="flex flex-col gap-6">
        <h2 id="catalog-heading" className="font-display text-3xl text-primary">
          From our dairy
        </h2>
        {catalog.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-muted">
            {isSupabaseConfigured
              ? "No products are live yet."
              : "Connect Supabase (see README) to load products."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((product) => {
              const variant = product.variants.find((v) => v.is_default) ?? product.variants.at(0);
              return (
                <li key={product.id} className="flex flex-col gap-1 rounded-2xl bg-surface p-6">
                  {product.badge && (
                    <span className="self-start rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">
                      {product.badge}
                    </span>
                  )}
                  <span className="mt-2 font-display text-xl text-primary">{product.name}</span>
                  {product.name_hi && (
                    <span className="font-deva text-muted" lang="hi">
                      {product.name_hi}
                    </span>
                  )}
                  {variant && (
                    <span className="mt-2 font-semibold">
                      {formatPaise(variant.price_paise)}{" "}
                      <span className="font-normal text-muted">· {variant.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Palette tokens" className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-primary px-4 py-2 text-on-primary">Primary</span>
        <span className="rounded-full bg-accent px-4 py-2 text-on-accent">Accent</span>
        <span className="rounded-full border border-line bg-surface px-4 py-2">Surface</span>
        <span className="rounded-full border border-metal px-4 py-2 text-muted">Metal line</span>
      </section>
    </main>
  );
}
