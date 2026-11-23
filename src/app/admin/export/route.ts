import { adminRepo, getOwner } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { istToday, parseFilters, rangeWindow } from "@/lib/admin/filters";
import { formatExportTime } from "@/lib/admin/format";
import { PAYMENT_METHOD_LABELS, STATUS_LABELS } from "@/lib/admin/status";
import { DELIVERY_SLOTS } from "@/lib/order/schema";

const MAX_ROWS = 5000;

/** CSV of the orders matching the dashboard's current filters. Owners only. */
export async function GET(request: Request) {
  const owner = await getOwner();
  if (!owner) return new Response("Sign in to export orders.", { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = { ...parseFilters(params), page: 1, orderId: null };
  const now = new Date();
  const { orders } = await adminRepo(owner).listOrders(
    filters,
    rangeWindow(filters, now),
    MAX_ROWS,
  );

  const header = [
    "Reference",
    "Received (IST)",
    "Status",
    "Customer",
    "Phone",
    "On WhatsApp",
    "Email",
    "Address line 1",
    "Address line 2",
    "Landmark",
    "Pincode",
    "City",
    "State",
    "On delivery list",
    "Slot",
    "Items",
    "Total (₹)",
    "Payment",
    "Paid by",
    "Customer note",
    "Your note",
    "Cancel reason",
  ];
  const rows = orders.map((o) => [
    o.reference,
    formatExportTime(o.createdAt),
    STATUS_LABELS[o.status],
    o.customerName,
    `+91 ${o.phone}`,
    o.whatsappOk ? "Yes" : "No",
    o.email,
    o.addressLine1,
    o.addressLine2,
    o.landmark,
    o.pincode,
    o.city,
    o.state,
    o.pincodeServiceable ? "Yes" : "No",
    DELIVERY_SLOTS.find((s) => s.value === o.slot)?.label ?? o.slot,
    o.items.map((i) => `${i.productName} ${i.variantLabel} x${i.quantity}`).join("; "),
    (o.totalPaise / 100).toFixed(2),
    o.paymentStatus === "paid" ? "Paid" : "Unpaid",
    o.paymentMethod ? PAYMENT_METHOD_LABELS[o.paymentMethod] : null,
    o.note,
    o.ownerNote,
    o.cancelReason,
  ]);

  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${istToday(now)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
