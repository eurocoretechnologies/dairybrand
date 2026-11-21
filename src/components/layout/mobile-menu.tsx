"use client";

import Link from "next/link";
import { useRef } from "react";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import { NAV_LINKS } from "@/content/site";

export function MobileMenu() {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="flex size-11 items-center justify-center rounded-full text-primary lg:hidden"
      >
        <MenuIcon size={22} />
      </button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(22rem,88vw)] bg-ground p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="flex h-full flex-col gap-6 p-5">
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center self-end rounded-full text-primary hover:bg-surface"
          >
            <CloseIcon />
          </button>
          <nav aria-label="Main">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="border-b border-line">
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block py-4 font-display text-2xl text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/order" onClick={close} className={`${buttonStyles.primary} mt-auto`}>
            Place an order
          </Link>
        </div>
      </dialog>
    </>
  );
}
