import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Cookie-less client for public, cacheable reads (catalogue, banners,
 * reviews, public settings). Runs as the `anon` role, so row-level security
 * limits it to public data. Returns null when Supabase is not configured.
 */
export function createPublicClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
