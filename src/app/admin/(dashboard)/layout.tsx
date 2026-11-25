import Link from "next/link";
import { Suspense } from "react";
import { BagIcon } from "@/components/icons";
import { Hindi } from "@/components/ui";
import { BRAND } from "@/content/site";
import { getOwner } from "@/lib/admin/auth";
import { signOut } from "../actions";

async function OwnerBadge() {
  const owner = await getOwner();
  if (!owner) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:flex-col lg:items-start lg:gap-2">
      {owner.demo && (
        <span className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-bold text-on-accent">
          Demo mode — sample orders, nothing is saved
        </span>
      )}
      <span className="max-w-full truncate opacity-80">{owner.email}</span>
      {!owner.demo && (
        <form action={signOut}>
          <button type="submit" className="min-h-11 font-semibold underline underline-offset-2">
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="flex flex-none flex-col gap-3 bg-primary px-4 py-4 text-on-primary lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:gap-8 lg:px-5 lg:py-7">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-[50%_50%_6px_6px/50%_50%_6px_6px] bg-accent pt-1 text-lg text-on-accent"
            >
              <Hindi>{BRAND.monogram}</Hindi>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl">{BRAND.name}</span>
              <span className="text-[11px] tracking-[0.16em] uppercase opacity-75">Owner</span>
            </span>
          </Link>
          <Link href="/" className="text-sm underline underline-offset-2 lg:hidden">
            View store
          </Link>
        </div>
        <nav aria-label="Dashboard" className="hidden lg:block">
          <Link
            href="/admin"
            aria-current="page"
            className="flex min-h-11 items-center gap-3 rounded-xl bg-on-primary/10 px-3 font-semibold"
          >
            <BagIcon size={18} /> Orders
          </Link>
          <Link
            href="/"
            className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3 opacity-85 hover:bg-on-primary/10"
          >
            View store
          </Link>
        </nav>
        <div className="mt-auto hidden rounded-2xl border border-on-primary/20 p-4 text-sm lg:block">
          <p className="font-bold">Coming later</p>
          <ul className="mt-2 flex flex-col gap-1 opacity-85">
            <li>Shiprocket shipping</li>
            <li>Online payments</li>
          </ul>
        </div>
        <div>
          <Suspense fallback={null}>
            <OwnerBadge />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
