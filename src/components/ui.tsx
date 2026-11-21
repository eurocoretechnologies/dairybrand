import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Shared class names so buttons and links stay consistent. */
export const buttonStyles = {
  primary:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  outline:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary px-7 font-semibold text-primary transition hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50",
  accent:
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 font-bold text-on-accent transition hover:opacity-90",
} as const;

export function Container({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-10 ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[13px] font-semibold tracking-[0.14em] uppercase ${className}`}>
      {children}
    </p>
  );
}

export function SectionHeading({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={`font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-normal ${className}`}
    >
      {children}
    </h2>
  );
}

export function Hindi({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span lang="hi" className={`font-deva ${className}`}>
      {children}
    </span>
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonStyles }) {
  return <Link className={`${buttonStyles[variant]} ${className}`} {...props} />;
}
