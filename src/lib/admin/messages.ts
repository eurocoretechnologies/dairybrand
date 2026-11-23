import { BRAND } from "@/content/site";
import { formatPaise } from "@/lib/money";
import { DELIVERY_SLOTS } from "@/lib/order/schema";
import type { DeliverySlot } from "@/types/database";

/** Pre-filled WhatsApp text the owner sends to confirm an order. */
export function confirmationMessage(order: {
  reference: string;
  customerName: string;
  slot: DeliverySlot;
  totalPaise: number;
  items: { productName: string; variantLabel: string; quantity: number }[];
}): string {
  const first = order.customerName.split(/\s+/)[0] || order.customerName;
  const slot = DELIVERY_SLOTS.find((s) => s.value === order.slot);
  return [
    `Hi ${first}, this is ${BRAND.name}. Thank you for your order ${order.reference}:`,
    ...order.items.map((i) => `• ${i.productName} ${i.variantLabel} × ${i.quantity}`),
    `Total: ${formatPaise(order.totalPaise)}`,
    "",
    `Preferred delivery: ${slot ? `${slot.label.toLowerCase()} (${slot.time})` : order.slot}.`,
    "Can you confirm the delivery date that suits you? You can pay by UPI or cash on delivery.",
  ].join("\n");
}
