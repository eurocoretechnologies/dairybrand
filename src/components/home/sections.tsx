import Link from "next/link";
import { ProductArt } from "@/components/art/product-art";
import {
  ArrowRightIcon,
  BagIcon,
  CheckIcon,
  PinIcon,
  PlusIcon,
  StarRow,
  WhatsAppIcon,
} from "@/components/icons";
import { Container, Eyebrow, Hindi, SectionHeading, buttonStyles } from "@/components/ui";
import {
  BRAND,
  CATEGORIES,
  COMPARISON,
  FAQS,
  HERO,
  ORDERING_STEPS,
  PROCESS_STEPS,
  STORY,
} from "@/content/site";
import type { ReviewSummary } from "@/lib/data/content";
import type { PublicSettings } from "@/lib/data/settings";
import type { Review } from "@/lib/data/types";

export function Hero({ batch }: { batch: PublicSettings["batch"] }) {
  return (
    <section className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-x-[clamp(32px,5vw,72px)] gap-y-12 px-4 pt-10 pb-12 sm:px-10 sm:pt-[clamp(40px,6vw,88px)] sm:pb-[clamp(48px,6vw,96px)]">
      <div className="min-w-0 flex-[1.2_1_460px]">
        <Eyebrow className="flex items-center gap-2.5 text-muted">
          <span aria-hidden className="h-px w-7 bg-muted" />
          {HERO.eyebrow}
        </Eyebrow>
        <h1 className="mt-5 font-display text-[clamp(3rem,5vw,4.5rem)] leading-[1.02] tracking-[-0.02em] text-primary">
          <span className="sm:whitespace-nowrap">{HERO.titleLines[0]}</span>
          <br />
          <span className="sm:whitespace-nowrap">{HERO.titleLines[1]}</span>
        </h1>
        <p className="mt-6 max-w-[520px] text-[clamp(1.0625rem,1.4vw,1.1875rem)] leading-relaxed">
          {HERO.body}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/#shop" className={`${buttonStyles.primary} min-h-14 px-8`}>
            Shop the harvest <ArrowRightIcon size={18} />
          </Link>
          <Link href="/#process" className={`${buttonStyles.outline} min-h-14 px-8`}>
            See how it&apos;s made
          </Link>
        </div>
        <ul className="mt-11 flex flex-wrap gap-x-7 gap-y-3.5 text-sm">
          {HERO.trustPoints.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <CheckIcon size={18} className="text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-[1_1_380px] justify-center">
        <div className="relative flex aspect-[5/6] w-full max-w-[500px] items-end justify-center overflow-hidden rounded-[50%_50%_28px_28px/42%_42%_28px_28px] bg-primary">
          <Hindi className="pointer-events-none absolute inset-x-0 top-[9%] text-center text-[clamp(7.5rem,16vw,13rem)] leading-none text-accent opacity-15">
            शुद्ध
          </Hindi>
          <div
            aria-hidden
            className="absolute inset-[18px] rounded-[50%_50%_16px_16px/42%_42%_16px_16px] border border-accent/35"
          />
          <ProductArt
            kind="ghee"
            onDark
            label={BRAND.name}
            title="Glass jar of golden bilona ghee with a brass lid"
            className="relative mb-[9%] w-[62%]"
          />
          {batch.number && (
            <div className="absolute bottom-[7%] left-[7%] flex flex-col gap-1 rounded-[14px] bg-ground px-4 py-3.5 shadow-xl">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                This week&apos;s batch
              </span>
              <span className="font-display text-lg text-primary">
                No. {batch.number}
                {batch.churnedOn && ` · Churned ${formatShortDate(batch.churnedOn)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00+05:30`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      });
}

export function CategoryStrip() {
  return (
    <div className="border-y border-line bg-surface">
      <Container className="flex flex-wrap justify-between gap-x-7 gap-y-3 py-5 font-display text-[clamp(1.125rem,1.8vw,1.5rem)] text-primary">
        {CATEGORIES.map((c, i) => (
          <span key={c.key} className="flex items-center gap-7">
            {i > 0 && (
              <span aria-hidden className="text-metal">
                ✦
              </span>
            )}
            <span>
              {c.label} <Hindi className="text-[0.8em] text-muted">{c.hindi}</Hindi>
            </span>
          </span>
        ))}
      </Container>
    </div>
  );
}

export function ProcessSection() {
  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="scroll-mt-24 bg-primary text-on-primary"
    >
      <Container className="py-[clamp(64px,8vw,120px)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-accent">The bilona method</Eyebrow>
            <SectionHeading id="process-heading" className="mt-3.5">
              From pasture to
              <br />
              glass jar, by hand.
            </SectionHeading>
          </div>
          <p className="max-w-[420px] leading-relaxed opacity-85">
            Most commercial ghee is made from cream skimmed by machine. Ours starts as whole-milk
            curd — it takes far more milk and far more time, and you can taste the difference.
          </p>
        </div>
        <ol className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-on-primary/25 pt-7 pr-7 pb-2">
              <div className="font-display text-[44px] leading-none text-accent">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 font-display text-[23px]">{step.title}</h3>
              <Hindi className="mt-1 block text-[15px] opacity-75">{step.hindi}</Hindi>
              <p className="mt-3.5 text-[15px] leading-relaxed opacity-85">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** Decorative panels standing in for farm photography until it is supplied. */
function PhotoPanel({ className, glyph }: { className: string; glyph: string }) {
  return (
    <div
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    >
      <Hindi className="text-[clamp(4rem,9vw,7rem)] leading-none text-primary opacity-15">
        {glyph}
      </Hindi>
    </div>
  );
}

export function StorySection() {
  return (
    <section id="story" aria-labelledby="story-heading" className="scroll-mt-24">
      <Container className="flex flex-wrap items-center gap-[clamp(32px,5vw,80px)] py-[clamp(64px,8vw,120px)]">
        <div className="grid min-w-0 flex-[1_1_420px] grid-cols-2 gap-4">
          <PhotoPanel
            glyph="गौ"
            className="row-span-2 min-h-[340px] rounded-[50%_50%_20px_20px/35%_35%_20px_20px] bg-surface sm:min-h-[460px]"
          />
          <PhotoPanel glyph="मथ" className="min-h-40 rounded-[20px] bg-line/60 sm:min-h-[222px]" />
          <PhotoPanel
            glyph="आँच"
            className="min-h-40 rounded-[20px] bg-accent/30 sm:min-h-[222px]"
          />
        </div>
        <div className="min-w-0 flex-[1_1_400px]">
          <Eyebrow className="text-muted">{STORY.eyebrow}</Eyebrow>
          <SectionHeading id="story-heading" className="mt-3.5 text-primary">
            {STORY.title[0]}
            <br />
            {STORY.title[1]}
          </SectionHeading>
          <p className="mt-6 text-[17px] leading-relaxed">{STORY.body}</p>
          <blockquote className="mt-8 border-t border-line pt-6">
            <p className="font-display text-[22px] leading-snug text-primary">“{STORY.quote}”</p>
            <footer className="mt-3.5 text-sm text-muted">— {STORY.quoteBy}</footer>
          </blockquote>
        </div>
      </Container>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section aria-labelledby="compare-heading" className="border-y border-line bg-surface">
      <div className="mx-auto max-w-[1040px] px-4 py-[clamp(64px,8vw,110px)] sm:px-10">
        <h2
          id="compare-heading"
          className="text-center font-display text-[clamp(2rem,3.6vw,3rem)] leading-tight text-primary"
        >
          {COMPARISON.title}
        </h2>
        <div className="mt-11 overflow-x-auto rounded-[20px] border border-line bg-ground">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <td className="p-5 sm:px-7" />
                <th
                  scope="col"
                  className="bg-primary/5 p-5 font-display text-xl font-normal text-primary sm:px-7"
                >
                  {COMPARISON.ours}
                </th>
                <th scope="col" className="p-5 font-display text-xl font-normal text-muted sm:px-7">
                  {COMPARISON.theirs}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.rows.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="p-5 font-semibold sm:px-7">
                    {row.label}
                  </th>
                  <td className="bg-primary/5 p-5 text-primary sm:px-7">{row.ours}</td>
                  <td className="p-5 text-muted sm:px-7">{row.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection({
  reviews,
  summary,
}: {
  reviews: Review[];
  summary: ReviewSummary | null;
}) {
  if (reviews.length === 0 || !summary) return null;
  const [featured, ...rest] = reviews.some((r) => r.isFeatured)
    ? [reviews.find((r) => r.isFeatured)!, ...reviews.filter((r) => !r.isFeatured)]
    : reviews;
  const others = rest.slice(0, 4);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-24 border-b border-line bg-surface"
    >
      <Container className="py-[clamp(64px,8vw,120px)]">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div>
            <Eyebrow className="text-muted">From our customers&apos; kitchens</Eyebrow>
            <SectionHeading id="reviews-heading" className="mt-3.5 text-primary">
              What people say
            </SectionHeading>
          </div>
          <div className="flex items-center gap-5 rounded-[20px] border border-line bg-ground px-6 py-4">
            <span className="font-display text-5xl leading-none text-primary">
              {summary.average.toFixed(1)}
            </span>
            <span>
              <StarRow rating={Math.round(summary.average)} size={18} />
              <span className="mt-1.5 block text-sm">
                from {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-stretch gap-5">
          <figure className="relative m-0 flex min-w-0 flex-[1_1_360px] flex-col overflow-hidden rounded-[28px] bg-primary p-[clamp(28px,4vw,44px)] text-on-primary">
            <span
              aria-hidden
              className="absolute -top-8 right-5 font-display text-[15rem] leading-none text-accent opacity-20"
            >
              “
            </span>
            <StarRow rating={featured.rating} size={18} />
            <blockquote className="relative mt-6 font-display text-[clamp(1.5rem,2.4vw,1.875rem)] leading-snug">
              {featured.body}
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3.5 pt-8">
              <Initial name={featured.customerName} className="bg-accent text-on-accent" />
              <span>
                <span className="block font-bold">{featured.customerName}</span>
                <span className="block text-sm opacity-80">
                  {[featured.city, featured.productName].filter(Boolean).join(" · ")}
                </span>
              </span>
            </figcaption>
          </figure>

          {others.length > 0 && (
            <div className="grid min-w-0 flex-[1.4_1_480px] grid-cols-1 gap-5 sm:grid-cols-2">
              {others.map((review) => (
                <figure
                  key={review.id}
                  className="m-0 flex flex-col rounded-[22px] border border-line bg-ground p-6"
                >
                  <StarRow rating={review.rating} size={15} />
                  <blockquote className="mt-4 leading-relaxed">{review.body}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 pt-5">
                    <Initial
                      name={review.customerName}
                      className="size-10 bg-surface text-primary"
                    />
                    <span>
                      <span className="block text-[15px] font-bold text-primary">
                        {review.customerName}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {[review.city, review.productName].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
        <p className="mt-8 text-sm text-muted">
          Reviews are collected on WhatsApp after delivery and published with permission.
        </p>
      </Container>
    </section>
  );
}

function Initial({ name, className }: { name: string; className: string }) {
  const letter =
    name
      .replace(/[^\p{L}]/gu, "")
      .charAt(0)
      .toUpperCase() || "•";
  return (
    <span
      aria-hidden
      className={`flex size-12 flex-none items-center justify-center rounded-full font-bold ${className}`}
    >
      {letter}
    </span>
  );
}

export function OrderingSteps() {
  const icons = [BagIcon, PinIcon, WhatsAppIcon];
  return (
    <section aria-labelledby="ordering-heading">
      <Container className="py-[clamp(64px,8vw,120px)]">
        <div className="mx-auto max-w-[640px] text-center">
          <Eyebrow className="text-muted">How ordering works</Eyebrow>
          <SectionHeading id="ordering-heading" className="mt-3.5 text-primary">
            Simple, and personal.
          </SectionHeading>
        </div>
        <ol className="mt-13 grid grid-cols-1 gap-5 md:grid-cols-3">
          {ORDERING_STEPS.map((step, i) => {
            const Icon = icons[i] ?? PlusIcon;
            const last = i === ORDERING_STEPS.length - 1;
            return (
              <li
                key={step.title}
                className={`rounded-3xl p-8 ${last ? "bg-primary text-on-primary" : "border border-line bg-ground"}`}
              >
                <span
                  className={`flex size-13 items-center justify-center rounded-full ${last ? "bg-accent text-on-accent" : "bg-surface text-primary"}`}
                >
                  <Icon size={24} />
                </span>
                <h3 className={`mt-6 font-display text-[22px] ${last ? "" : "text-primary"}`}>
                  {i + 1}. {step.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed opacity-90">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-[880px] scroll-mt-24 px-4 pb-[clamp(64px,8vw,120px)] sm:px-10"
    >
      <h2 id="faq-heading" className="mb-7 font-display text-[clamp(2rem,3.6vw,3rem)] text-primary">
        Questions, answered
      </h2>
      {FAQS.map((faq) => (
        <details key={faq.q} className="group border-t border-line py-1 last:border-b">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-primary [&::-webkit-details-marker]:hidden">
            {faq.q}
            <span
              aria-hidden
              className="flex size-9 flex-none items-center justify-center rounded-full border border-line transition group-open:rotate-45"
            >
              <PlusIcon size={14} />
            </span>
          </summary>
          <p className="mb-5 max-w-[720px] leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </section>
  );
}
