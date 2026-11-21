import { z } from "zod";
import { PALETTE_KEYS } from "@/theme/palettes";

/**
 * Public environment, safe in the browser. Supabase values are optional so
 * the app builds and runs (with default content) before a project exists.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  /** Allow `?palette=<key>` to preview other palettes. Off in production. */
  NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW: process.env.NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW || undefined,
});

export const isSupabaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** Server-only environment. Import from server code only. */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  /** Used when the `settings.palette` row is missing or unreadable. */
  DEFAULT_PALETTE: z.enum(PALETTE_KEYS).optional(),
});

export function serverEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    DEFAULT_PALETTE: process.env.DEFAULT_PALETTE || undefined,
  });
}
