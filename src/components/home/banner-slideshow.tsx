"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ProductArt } from "@/components/art/product-art";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/icons";
import { Hindi } from "@/components/ui";
import type { Banner } from "@/lib/data/types";

const INTERVAL_MS = 5500;

const VARIANT_STYLES: Record<Banner["variant"], { panel: string; badge: string; cta: string }> = {
  primary: {
    panel: "bg-primary text-on-primary",
    badge: "border border-accent text-accent",
    cta: "bg-accent text-on-accent",
  },
  surface: {
    panel: "bg-surface text-ink",
    badge: "bg-primary text-on-primary",
    cta: "bg-primary text-on-primary",
  },
  accent: {
    panel: "bg-accent text-on-accent",
    badge: "border border-on-accent text-on-accent",
    cta: "bg-on-accent text-accent",
  },
};

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

function BannerArt({ banner }: { banner: Banner }) {
  if (banner.imageUrl) {
    return (
      <Image
        src={banner.imageUrl}
        alt=""
        fill
        sizes="(min-width: 1024px) 560px, 90vw"
        className="object-contain object-bottom"
      />
    );
  }
  if (banner.variant === "accent") {
    return <ProductArt kind="gift" className="w-[72%] max-w-80 self-center" />;
  }
  if (banner.variant === "surface") {
    return (
      <div className="flex w-full items-end justify-center gap-[2%]">
        <ProductArt kind="milk" className="w-[28%]" />
        <ProductArt kind="milk" className="w-[36%]" label="Ksheera" />
        <ProductArt kind="milk" className="w-[28%]" />
      </div>
    );
  }
  return (
    <div className="flex w-full items-end justify-center gap-[4%]">
      <ProductArt kind="ghee" onDark className="w-[24%]" />
      <ProductArt kind="ghee" onDark className="w-[36%]" label="Ksheera" />
      <ProductArt kind="ghee-light" onDark className="w-[22%]" />
    </div>
  );
}

/**
 * Offer and announcement posters. Auto-advances every 5.5 s; pauses on hover,
 * on keyboard focus, with the pause button, and never auto-advances for
 * people who prefer reduced motion. Supports swipe on touch screens.
 */
export function BannerSlideshow({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStart = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  const autoplay = count > 1 && !paused && !hovered && !focused && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(t);
  }, [autoplay, count]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers and announcements"
      className="mx-auto w-full max-w-[1240px] px-4 pb-12 sm:px-10 sm:pb-20"
    >
      <div
        className="relative overflow-hidden rounded-[24px] sm:rounded-[32px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          const end = e.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start == null || end == null || Math.abs(end - start) < 40) return;
          go(end < start ? index + 1 : index - 1);
        }}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(.65,0,.35,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={autoplay ? "off" : "polite"}
        >
          {banners.map((banner, i) => {
            const styles = VARIANT_STYLES[banner.variant];
            const current = i === index;
            return (
              <div
                key={banner.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!current}
                inert={!current}
                className={`relative flex min-h-[420px] w-full flex-none flex-col overflow-hidden sm:min-h-[440px] md:flex-row md:items-center ${styles.panel}`}
              >
                {banner.variant === "primary" && (
                  <Hindi className="pointer-events-none absolute -right-8 -bottom-24 text-[22rem] leading-none text-accent opacity-[0.08]">
                    घी
                  </Hindi>
                )}
                <div className="relative z-10 flex-1 p-7 pb-0 sm:p-12 md:p-16 md:pr-6">
                  {banner.eyebrow && (
                    <span
                      className={`inline-block rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-[0.16em] uppercase sm:text-xs ${styles.badge}`}
                    >
                      {banner.eyebrow}
                    </span>
                  )}
                  <h2 className="mt-5 font-display text-[clamp(2.1rem,4.4vw,3.9rem)] leading-[1.04]">
                    {banner.title}
                  </h2>
                  {banner.body && (
                    <p className="mt-4 max-w-md text-base leading-relaxed opacity-90 sm:text-[17px]">
                      {banner.body}
                    </p>
                  )}
                  {banner.ctaLabel && banner.ctaHref && (
                    <Link
                      href={banner.ctaHref}
                      className={`mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-7 font-bold ${styles.cta}`}
                    >
                      {banner.ctaLabel}
                      <ArrowRightIcon size={18} />
                    </Link>
                  )}
                </div>
                <div className="relative flex min-h-48 flex-1 items-end justify-center self-stretch px-8 pt-6 pb-14 md:min-h-0 md:pb-12">
                  <BannerArt banner={banner} />
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute top-1/2 left-3 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-ground/90 text-primary shadow-md sm:flex"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute top-1/2 right-3 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-ground/90 text-primary shadow-md sm:flex"
            >
              <ChevronRightIcon />
            </button>
            <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center">
              <div className="flex items-center rounded-full bg-ink/40 px-1 backdrop-blur-sm">
                {banners.map((banner, i) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className="flex size-9 items-center justify-center sm:size-11"
                  >
                    <span
                      className={`block h-2 rounded-full bg-ground transition-all ${
                        i === index ? "w-7" : "w-2 opacity-60"
                      }`}
                    />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                  className="flex size-11 items-center justify-center text-ground"
                >
                  {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
