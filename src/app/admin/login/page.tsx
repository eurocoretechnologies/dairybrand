import type { Metadata } from "next";
import { Hindi } from "@/components/ui";
import { BRAND } from "@/content/site";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 text-primary">
          <span
            aria-hidden
            className="flex size-11 items-center justify-center rounded-[50%_50%_6px_6px/50%_50%_6px_6px] bg-primary pt-1 text-xl text-accent"
          >
            <Hindi>{BRAND.monogram}</Hindi>
          </span>
          <span className="font-display text-2xl">{BRAND.name}</span>
        </div>
        <h1 className="mt-8 font-display text-4xl text-primary">Owner sign in</h1>
        <p className="mt-2 text-muted">See and manage your orders.</p>
        <LoginForm />
      </div>
    </main>
  );
}
