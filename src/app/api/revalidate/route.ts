import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { tagFromPayload } from "@/lib/data/cache-tags";

/**
 * Refreshes cached public data right after the dev team edits it, instead of
 * waiting for the 5-minute revalidation. Called by Supabase database webhooks
 * (body `{ "table": "products", … }`) or by hand:
 *
 *   curl -X POST https://<site>/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "Content-Type: application/json" -d '{"tag":"catalog"}'
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const tag = tagFromPayload(body);
  if (!tag) {
    return Response.json({ error: "Unknown tag or table" }, { status: 400 });
  }

  revalidateTag(tag, "max");
  return Response.json({ revalidated: tag });
}
