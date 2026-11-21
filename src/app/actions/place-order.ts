"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { DEMO_PRODUCTS, isDemoContentEnabled } from "@/lib/data/demo-content";
import { sendOrderEmails } from "@/lib/email/send-order-emails";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";
import { findCartChanges, type CartChange, type CurrentVariant } from "@/lib/order/reprice";
import { fieldErrors, orderRequestSchema, type FieldErrors } from "@/lib/order/schema";
import { createServiceClient } from "@/lib/supabase/service";

export type PlaceOrderResult =
  | { status: "ok"; reference: string; duplicate: boolean }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "cart_changed"; changes: CartChange[] }
  | { status: "error"; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  "order:empty_cart": "Your order is empty. Add a product and try again.",
  "order:too_many_items": "That's too many different products for one order.",
  "order:bad_quantity": "Each product can be ordered 1 to 20 at a time.",
  "order:unavailable_item": "Something in your order just went out of stock. Please review it.",
  "order:rate_limited_phone":
    "We've received several orders from this number in the last hour. Please message us on WhatsApp instead.",
  "order:rate_limited_ip":
    "Too many orders from this connection in the last hour. Please try again later or message us on WhatsApp.",
};
const GENERIC_ERROR =
  "We couldn't send your order request. Please try again, or message us on WhatsApp.";

async function clientIpHash(): Promise<string | null> {
  const salt = serverEnv().IP_HASH_SALT;
  if (!salt) return null;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0]?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function currentVariants(ids: string[]): Promise<CurrentVariant[]> {
  if (!isSupabaseConfigured) {
    return DEMO_PRODUCTS.flatMap((p) =>
      p.variants
        .filter((v) => ids.includes(v.id))
        .map((v) => ({ id: v.id, pricePaise: v.pricePaise, available: v.inStock })),
    );
  }
  const { data, error } = await createServiceClient()
    .from("product_variants")
    .select("id, price_paise, in_stock, product:products!inner(is_active)")
    .in("id", ids)
    .returns<
      { id: string; price_paise: number; in_stock: boolean; product: { is_active: boolean } }[]
    >();
  if (error) throw new Error(`Could not load prices: ${error.message}`);
  return data.map((v) => ({
    id: v.id,
    pricePaise: v.price_paise,
    available: v.in_stock && v.product.is_active,
  }));
}

/**
 * Validates an order request, re-checks prices and stock against the
 * database, and saves it. Emails go out after the response is sent.
 */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = orderRequestSchema.safeParse(input);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // A filled honeypot means a bot: give it nothing useful.
    if ("website" in (input as object) && (input as { website?: string }).website) {
      return { status: "error", message: GENERIC_ERROR };
    }
    return { status: "invalid", errors };
  }
  const order = parsed.data;

  const demo = !isSupabaseConfigured;
  if (demo && !isDemoContentEnabled()) {
    return {
      status: "error",
      message: "Ordering isn't available yet. Please message us on WhatsApp.",
    };
  }

  try {
    const changes = findCartChanges(
      order.items,
      await currentVariants(order.items.map((i) => i.variantId)),
    );
    if (changes.length > 0) return { status: "cart_changed", changes };

    if (demo) {
      console.info("Demo order request received (not saved):", order.items.length, "lines");
      return { status: "ok", reference: "KS-DEMO", duplicate: false };
    }

    const { data, error } = await createServiceClient()
      .rpc("place_order", {
        p_customer: {
          customer_name: order.customerName,
          phone: order.phone,
          whatsapp_ok: order.whatsappOk,
          email: order.email ?? "",
          address_line1: order.addressLine1,
          address_line2: order.addressLine2,
          landmark: order.landmark ?? "",
          pincode: order.pincode,
          city: order.city,
          state: order.state,
          slot: order.slot,
          note: order.note ?? "",
        },
        p_items: order.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        p_ip_hash: await clientIpHash(),
      })
      .single();

    if (error || !data) {
      const known = error?.message && ERROR_MESSAGES[error.message];
      if (!known) console.error("place_order failed:", error?.message);
      return { status: "error", message: known || GENERIC_ERROR };
    }

    if (!data.is_duplicate) after(() => sendOrderEmails(data.order_id));
    return { status: "ok", reference: data.reference, duplicate: data.is_duplicate };
  } catch (error) {
    console.error("placeOrder failed:", error);
    return { status: "error", message: GENERIC_ERROR };
  }
}
