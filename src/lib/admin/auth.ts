import "server-only";
import { redirect } from "next/navigation";
import { isDemoContentEnabled } from "@/lib/data/demo-content";
import { isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { demoAdminRepo } from "./demo-repo";
import { isOwnerClaims } from "./access";
import { supabaseAdminRepo } from "./supabase-repo";
import type { AdminRepo } from "./types";

export type Owner = { id: string; email: string | null; demo: boolean };

/** Demo dashboard with sample orders: only without Supabase and with DEMO_CONTENT=true. */
export function isAdminDemo(): boolean {
  return !isSupabaseConfigured && isDemoContentEnabled();
}

/** The signed-in owner, or null. Verifies the session token. */
export async function getOwner(): Promise<Owner | null> {
  if (isAdminDemo()) return { id: "demo", email: "demo owner", demo: true };
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims || !isOwnerClaims(data.claims)) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email, demo: false };
}

/** For pages and actions: the owner, or a redirect to the login page. */
export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner();
  if (!owner) redirect("/admin/login");
  return owner;
}

export function adminRepo(owner: Owner): AdminRepo {
  return owner.demo ? demoAdminRepo() : supabaseAdminRepo();
}

export { isOwnerClaims };
