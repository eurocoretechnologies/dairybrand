"use client";

import { useActionState } from "react";
import { buttonStyles } from "@/components/ui";
import { signIn, type SignInState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {
    error: null,
    email: "",
  });

  const input =
    "h-12 w-full rounded-xl border border-line bg-ground px-4 text-ink aria-[invalid=true]:border-2 aria-[invalid=true]:border-primary";

  return (
    <form
      action={action}
      // Where to return after signing in (the proxy adds ?next= when it redirects here).
      onSubmit={(e) => {
        const field = e.currentTarget.elements.namedItem("next") as HTMLInputElement | null;
        const value = new URLSearchParams(window.location.search).get("next");
        if (field && value) field.value = value;
      }}
      className="mt-8 flex flex-col gap-5"
    >
      <input type="hidden" name="next" defaultValue="/admin" />
      {state.error && (
        <p
          role="alert"
          id="login-error"
          className="rounded-xl border-2 border-primary bg-ground p-3 text-sm font-semibold text-primary"
        >
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={input}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          className={input}
        />
      </div>
      <button type="submit" disabled={pending} className={`${buttonStyles.primary} mt-2`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted">
        Forgot your password? Ask the site team to send a reset link.
      </p>
    </form>
  );
}
