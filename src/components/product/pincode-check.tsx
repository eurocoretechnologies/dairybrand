"use client";

import { useActionState } from "react";
import { checkPincode, type PincodeResult } from "@/app/actions/check-pincode";
import { CheckIcon, PinIcon } from "@/components/icons";

type State = PincodeResult | { status: "idle" };

async function submit(_prev: State, formData: FormData): Promise<State> {
  return checkPincode(String(formData.get("pincode") ?? ""));
}

const MESSAGES: Record<Exclude<State["status"], "idle" | "serviceable">, string> = {
  invalid: "Enter a valid 6-digit pincode.",
  not_serviceable:
    "We don't deliver here yet. You can still send an order request and we'll let you know.",
  unknown: "We couldn't check right now. You can still send an order request.",
};

export function PincodeCheck() {
  const [state, action, pending] = useActionState(submit, { status: "idle" });

  return (
    <form action={action} className="mt-7 rounded-[20px] bg-surface p-5">
      <label
        htmlFor="pincode"
        className="flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <PinIcon size={18} />
        Check delivery to your pincode
      </label>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <input
          id="pincode"
          name="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[1-9][0-9]{5}"
          maxLength={6}
          required
          placeholder="e.g. 411001"
          aria-describedby="pincode-result"
          className="h-12 min-w-0 flex-[1_1_160px] rounded-xl border border-line bg-ground px-4 text-ink"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl border-[1.5px] border-primary px-5 font-semibold text-primary disabled:opacity-50"
        >
          {pending ? "Checking…" : "Check"}
        </button>
      </div>
      <p id="pincode-result" aria-live="polite" className="mt-3 text-sm empty:hidden">
        {state.status === "serviceable" ? (
          <span className="flex items-center gap-1.5 font-semibold text-primary">
            <CheckIcon size={16} />
            We deliver here{state.area ? ` (${state.area}, ${state.city})` : ` — ${state.city}`}.
          </span>
        ) : state.status === "idle" ? null : (
          MESSAGES[state.status]
        )}
      </p>
    </form>
  );
}
