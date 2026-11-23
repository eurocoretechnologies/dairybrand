import "server-only";
import { Resend } from "resend";
import { publicEnv, serverEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { resolvePaletteKey } from "@/theme/palettes";
import {
  customerReceiptEmail,
  ownerNewOrderEmail,
  type Email,
  type OrderEmailData,
} from "./templates";

async function loadOrder(orderId: string) {
  const supabase = createServiceClient();
  const [{ data: order, error }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, reference, customer_name, phone, whatsapp_ok, email, address_line1, address_line2, landmark, pincode, city, state, pincode_serviceable, slot, note, total_paise, " +
          "items:order_items(product_name, variant_label, quantity, line_total_paise)",
      )
      .eq("id", orderId)
      .single()
      .returns<{
        id: string;
        reference: string;
        customer_name: string;
        phone: string;
        whatsapp_ok: boolean;
        email: string | null;
        address_line1: string;
        address_line2: string;
        landmark: string | null;
        pincode: string;
        city: string;
        state: string;
        pincode_serviceable: boolean;
        slot: OrderEmailData["slot"];
        note: string | null;
        total_paise: number;
        items: {
          product_name: string;
          variant_label: string;
          quantity: number;
          line_total_paise: number;
        }[];
      }>(),
    supabase.from("settings").select("key, value").in("key", ["owner_email", "palette"]),
  ]);
  if (error || !order) throw new Error(`Order ${orderId} not found: ${error?.message}`);

  const setting = (key: string) => settings?.find((s) => s.key === key)?.value;
  const ownerEmail = setting("owner_email");

  const data: OrderEmailData = {
    id: order.id,
    reference: order.reference,
    customerName: order.customer_name,
    phone: order.phone,
    whatsappOk: order.whatsapp_ok,
    email: order.email,
    address: [
      order.address_line1,
      [order.address_line2, order.landmark && `landmark: ${order.landmark}`]
        .filter(Boolean)
        .join(", "),
      `${order.city} ${order.pincode}, ${order.state}`,
    ],
    pincodeServiceable: order.pincode_serviceable,
    slot: order.slot,
    note: order.note,
    items: order.items.map((i) => ({
      name: i.product_name,
      label: i.variant_label,
      quantity: i.quantity,
      lineTotalPaise: i.line_total_paise,
    })),
    totalPaise: order.total_paise,
  };
  return {
    data,
    ownerEmail: typeof ownerEmail === "string" && ownerEmail.includes("@") ? ownerEmail : null,
    palette: resolvePaletteKey(setting("palette")),
  };
}

async function sendWithRetry(resend: Resend, from: string, to: string, email: Email, tag: string) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "type", value: tag }],
    });
    if (!error) return;
    console.error(`Order email "${tag}" attempt ${attempt} failed:`, error.message);
  }
}

/**
 * Sends the owner notification and, when the customer gave an email, a
 * receipt. Runs after the order is saved; failures are logged and never
 * affect the order.
 */
export async function sendOrderEmails(orderId: string): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.warn("Order emails skipped: set RESEND_API_KEY and EMAIL_FROM.");
    return;
  }
  try {
    const { data, ownerEmail, palette } = await loadOrder(orderId);
    const resend = new Resend(RESEND_API_KEY);
    const adminUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/admin/orders/${data.id}`;
    const jobs: Promise<void>[] = [];
    if (ownerEmail) {
      jobs.push(
        sendWithRetry(
          resend,
          EMAIL_FROM,
          ownerEmail,
          ownerNewOrderEmail(data, adminUrl, palette),
          "owner_new_order",
        ),
      );
    } else {
      console.warn("Owner email skipped: set the owner_email row in settings.");
    }
    if (data.email) {
      jobs.push(
        sendWithRetry(
          resend,
          EMAIL_FROM,
          data.email,
          customerReceiptEmail(data, palette),
          "customer_receipt",
        ),
      );
    }
    await Promise.all(jobs);
  } catch (error) {
    console.error("Order emails failed:", error);
  }
}
