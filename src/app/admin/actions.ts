"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/admin/access";
import { adminRepo, isOwnerClaims, requireOwner } from "@/lib/admin/auth";
import { OwnerActionError } from "@/lib/admin/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Sign in / out
// ---------------------------------------------------------------------------

export type SignInState = { error: string | null; email: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!isSupabaseConfigured) {
    return { email, error: "Sign-in isn't set up yet: Supabase is not connected." };
  }
  if (!email || !password) {
    return { email, error: "Enter your email and password." };
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { email, error: "That email and password don't match. Try again." };
  }
  const { data: claims } = await supabase.auth.getClaims();
  if (!isOwnerClaims(claims?.claims)) {
    await supabase.auth.signOut();
    return { email, error: "This account doesn't have access to the orders dashboard." };
  }
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Order updates (owner only; the database enforces the same rules)
// ---------------------------------------------------------------------------

const orderId = z.uuid();

const statusInput = z
  .object({
    orderId,
    status: z.enum(["confirmed", "out_for_delivery", "delivered", "cancelled"]),
    cancelReason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.status !== "cancelled" || (v.cancelReason?.length ?? 0) >= 3, {
    message: "Add a short reason for cancelling.",
    path: ["cancelReason"],
  });

const paymentInput = z
  .object({
    orderId,
    paymentStatus: z.enum(["unpaid", "paid"]),
    paymentMethod: z.enum(["upi", "cash", "other"]).nullable(),
  })
  .refine((v) => v.paymentStatus === "unpaid" || v.paymentMethod !== null, {
    message: "Choose how it was paid.",
  });

const noteInput = z.object({
  orderId,
  note: z.string().trim().max(1000, "Keep the note under 1,000 characters."),
});

async function run<T>(schema: z.ZodType<T>, input: unknown, work: (v: T) => Promise<void>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." } as const;
  }
  try {
    await work(parsed.data);
  } catch (error) {
    if (error instanceof OwnerActionError) return { ok: false, error: error.message } as const;
    console.error("Owner action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." } as const;
  }
  refresh();
  return { ok: true } as const;
}

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  const owner = await requireOwner();
  return run(statusInput, input, (v) =>
    adminRepo(owner).updateStatus(
      v.orderId,
      v.status,
      v.status === "cancelled" ? (v.cancelReason ?? null) : null,
    ),
  );
}

export async function updateOrderPayment(input: unknown): Promise<ActionResult> {
  const owner = await requireOwner();
  return run(paymentInput, input, (v) =>
    adminRepo(owner).updatePayment(
      v.orderId,
      v.paymentStatus,
      v.paymentStatus === "paid" ? v.paymentMethod : null,
    ),
  );
}

export async function saveOwnerNote(input: unknown): Promise<ActionResult> {
  const owner = await requireOwner();
  return run(noteInput, input, (v) => adminRepo(owner).updateOwnerNote(v.orderId, v.note || null));
}
