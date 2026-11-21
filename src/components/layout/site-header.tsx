import Link from "next/link";
import { CartButton } from "@/components/cart/cart-drawer";
import { Hindi, buttonStyles } from "@/components/ui";
import { BRAND, NAV_LINKS } from "@/content/site";
import { MobileMenu } from "./mobile-menu";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 text-primary"
      aria-label={`${BRAND.name} home`}
    >
      <span
        aria-hidden
        className="flex size-11 items-center justify-center rounded-[50%_50%_6px_6px/50%_50%_6px_6px] bg-primary pt-1 text-xl text-accent"
      >
        <Hindi>{BRAND.monogram}</Hindi>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-2xl">{BRAND.name}</span>
        <span className="mt-1 hidden text-[10px] tracking-[0.22em] text-muted uppercase sm:block">
          {BRAND.tagline}
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader({ announcement }: { announcement: string | null }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {announcement && (
        <div className="bg-primary px-4 py-2.5 text-center text-[13px] text-on-primary">
          {announcement}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-ground/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-3 py-3 sm:px-10 sm:py-4">
          <div className="flex items-center gap-1">
            <MobileMenu />
            <Logo />
          </div>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex gap-7 text-[15px] font-medium">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="py-3 text-ink hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <CartButton />
            <Link href="/order" className={`${buttonStyles.primary} min-h-11 px-5 max-sm:hidden`}>
              Place an order
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
