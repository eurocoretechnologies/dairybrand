"use server";

import { cacheLife, cacheTag } from "next/cache";
import { DEMO_SERVICEABLE_PINCODES, isDemoContentEnabled } from "@/lib/data/demo-content";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { isValidPincode, normalizePincode } from "@/lib/pincode";
import { createPublicClient } from "@/lib/supabase/public";

export type PincodeResult =
  | { status: "invalid" }
  | { status: "serviceable"; area: string | null; city: string }
  | { status: "not_serviceable" }
  | { status: "unknown" };

async function lookupPincode(pincode: string): Promise<PincodeResult> {
  "use cache";
  cacheTag(CACHE_TAGS.catalog);
  cacheLife("hours");

  const supabase = createPublicClient();
  if (!supabase) {
    if (!isDemoContentEnabled()) return { status: "unknown" };
    return DEMO_SERVICEABLE_PINCODES.includes(pincode)
      ? { status: "serviceable", area: null, city: "Pune" }
      : { status: "not_serviceable" };
  }

  const { data, error } = await supabase
    .from("serviceable_pincodes")
    .select("area, city")
    .eq("pincode", pincode)
    .maybeSingle();

  if (error) {
    console.error("Pincode lookup failed:", error.message);
    return { status: "unknown" };
  }
  return data
    ? { status: "serviceable", area: data.area, city: data.city }
    : { status: "not_serviceable" };
}

/** Checks whether we deliver to a pincode. Safe to call from the browser. */
export async function checkPincode(input: string): Promise<PincodeResult> {
  if (typeof input !== "string" || !isValidPincode(input)) return { status: "invalid" };
  return lookupPincode(normalizePincode(input));
}
