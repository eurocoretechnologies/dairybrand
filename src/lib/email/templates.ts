import { BRAND } from "@/content/site";
import { formatPaise } from "@/lib/money";
import { DELIVERY_SLOTS } from "@/lib/order/schema";
import { PALETTES, type PaletteKey } from "@/theme/palettes";
import type { DeliverySlot } from "@/types/database";

/** The order as emails need it. Built from the saved order, never from the browser. */
export type OrderEmailData = {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  whatsappOk: boolean;
  email: string | null;
  address: string[];
  pincodeServiceable: boolean;
  slot: DeliverySlot;
  note: string | null;
  items: { name: string; label: string; quantity: number; lineTotalPaise: number }[];
  totalPaise: number;
};

export type Email = { subject: string; html: string; text: string };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const slotText = (slot: DeliverySlot) => {
  const s = DELIVERY_SLOTS.find((d) => d.value === slot);
  return s ? `${s.label} (${s.time})` : slot;
};

function itemsTable(order: OrderEmailData, ink: string, muted: string, line: string): string {
  const rows = order.items
    .map(
      (i) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${line};color:${ink}">${escapeHtml(i.name)} <span style="color:${muted}">${escapeHtml(i.label)} × ${i.quantity}</span></td>
  <td style="padding:10px 0;border-bottom:1px solid ${line};color:${ink};text-align:right;white-space:nowrap">${formatPaise(i.lineTotalPaise)}</td>
</tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:15px">${rows}
<tr><td style="padding:12px 0;font-weight:700;color:${ink}">Estimated total</td>
<td style="padding:12px 0;font-weight:700;color:${ink};text-align:right">${formatPaise(order.totalPaise)}</td></tr></table>`;
}

function layout(palette: PaletteKey, heading: string, body: string): string {
  const c = PALETTES[palette].colors;
  return `<!doctype html><html lang="en"><body style="margin:0;background:${c.ground};font-family:Arial,Helvetica,sans-serif;color:${c.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border:1px solid ${c.line};border-radius:16px">
<tr><td style="background:${c.primary};color:${c.onPrimary};padding:20px 28px;border-radius:16px 16px 0 0;font-family:Georgia,serif;font-size:22px">${escapeHtml(BRAND.name)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:24px;color:${c.primary}">${heading}</h1>
${body}
</td></tr></table></td></tr></table></body></html>`;
}

/** Email to the owner for every new order request. */
export function ownerNewOrderEmail(
  order: OrderEmailData,
  adminUrl: string,
  palette: PaletteKey,
): Email {
  const c = PALETTES[palette].colors;
  const flag = order.pincodeServiceable
    ? ""
    : `<p style="margin:0 0 16px;padding:10px 12px;background:${c.surface};border-radius:8px;color:${c.ink}"><strong>Pincode not on the delivery list.</strong> Check before confirming.</p>`;
  const detail = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:${c.muted};vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0;color:${c.ink}">${value}</td></tr>`;
  const body = `${flag}
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;margin-bottom:20px">
${detail("Customer", escapeHtml(order.customerName))}
${detail("Phone", `+91 ${escapeHtml(order.phone)}${order.whatsappOk ? " (WhatsApp)" : ""}`)}
${order.email ? detail("Email", escapeHtml(order.email)) : ""}
${detail("Address", order.address.map(escapeHtml).join("<br>"))}
${detail("Slot", escapeHtml(slotText(order.slot)))}
${order.note ? detail("Note", escapeHtml(order.note)) : ""}
</table>
${itemsTable(order, c.ink, c.muted, c.line)}
<p style="margin:24px 0 0"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:${c.primary};color:${c.onPrimary};padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">Open in the dashboard</a></p>`;

  const text = [
    `New order request ${order.reference}`,
    order.pincodeServiceable ? "" : "Pincode not on the delivery list. Check before confirming.",
    `Customer: ${order.customerName}`,
    `Phone: +91 ${order.phone}${order.whatsappOk ? " (WhatsApp)" : ""}`,
    order.email ? `Email: ${order.email}` : "",
    `Address: ${order.address.join(", ")}`,
    `Slot: ${slotText(order.slot)}`,
    order.note ? `Note: ${order.note}` : "",
    "",
    ...order.items.map(
      (i) => `${i.name} ${i.label} × ${i.quantity}: ${formatPaise(i.lineTotalPaise)}`,
    ),
    `Estimated total: ${formatPaise(order.totalPaise)}`,
    "",
    `Open in the dashboard: ${adminUrl}`,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");

  return {
    subject: `New order ${order.reference} · ${order.customerName} · ${formatPaise(order.totalPaise)}`,
    html: layout(palette, `New order request ${escapeHtml(order.reference)}`, body),
    text,
  };
}

/** Receipt to the customer, only when they gave an email address. */
export function customerReceiptEmail(order: OrderEmailData, palette: PaletteKey): Email {
  const c = PALETTES[palette].colors;
  const first = order.customerName.split(/\s+/)[0] ?? order.customerName;
  const body = `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi ${escapeHtml(first)}, thank you for your order request. Your reference is <strong>${escapeHtml(order.reference)}</strong>.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">We'll message you on ${order.whatsappOk ? "WhatsApp" : "your phone"} shortly to confirm availability, the delivery date and payment (UPI or cash on delivery). Nothing has been charged.</p>
${itemsTable(order, c.ink, c.muted, c.line)}
<p style="margin:20px 0 0;font-size:14px;color:${c.muted}">Delivery to: ${order.address.map(escapeHtml).join(", ")}<br>Preferred time: ${escapeHtml(slotText(order.slot))}</p>`;

  const text = [
    `Hi ${first}, thank you for your order request. Your reference is ${order.reference}.`,
    `We'll message you on ${order.whatsappOk ? "WhatsApp" : "your phone"} shortly to confirm availability, the delivery date and payment (UPI or cash on delivery). Nothing has been charged.`,
    "",
    ...order.items.map(
      (i) => `${i.name} ${i.label} × ${i.quantity}: ${formatPaise(i.lineTotalPaise)}`,
    ),
    `Estimated total: ${formatPaise(order.totalPaise)}`,
    "",
    `Delivery to: ${order.address.join(", ")}`,
    `Preferred time: ${slotText(order.slot)}`,
  ].join("\n");

  return {
    subject: `We've got your order request ${order.reference}`,
    html: layout(palette, "We've got your order request", body),
    text,
  };
}
