import "server-only";
import type { OrderStatus } from "@/types/database";
import { nextStatuses } from "./status";
import {
  OwnerActionError,
  type AdminOrderDetail,
  type AdminOrderEvent,
  type AdminRepo,
  type OrderStats,
} from "./types";

/**
 * In-memory orders for trying the dashboard without Supabase
 * (DEMO_CONTENT=true, local development only). Changes last until the server
 * restarts. Filtering mirrors list_orders and order_stats in the database.
 */

const HOUR = 3_600_000;
const NAMES = [
  ["Priya Deshmukh", "9822041001", "Baner", "411045"],
  ["Rohan Mehta", "9930052002", "Kothrud", "411038"],
  ["Anjali Kulkarni", "9764018003", "Aundh", "411007"],
  ["Imran Shaikh", "9011077004", "Wanowrie", "411040"],
  ["Sneha Patil", "9881063005", "Viman Nagar", "411014"],
  ["Vikram Joshi", "9372090006", "Hadapsar", "411028"],
  ["Farah Khan", "9850034007", "Camp", "411001"],
  ["Arjun Nair", "9730021008", "Wakad", "411057"],
  ["Meera Iyer", "9890012009", "Pashan", "411021"],
  ["Kabir Singh", "9922033010", "Kharadi", "411014"],
] as const;
const ITEMS = [
  { productName: "A2 Gir Cow Ghee", variantLabel: "500 ml", unitPricePaise: 145000 },
  { productName: "A2 Fresh Milk", variantLabel: "1 L glass", unitPricePaise: 11000 },
  { productName: "Malai Paneer", variantLabel: "200 g", unitPricePaise: 14000 },
  { productName: "Matka Dahi", variantLabel: "400 g", unitPricePaise: 9000 },
  { productName: "White Makhan", variantLabel: "200 g", unitPricePaise: 22000 },
];
const STATUSES: OrderStatus[] = [
  "new",
  "new",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "confirmed",
  "cancelled",
  "delivered",
];

function seed(): AdminOrderDetail[] {
  const now = Date.now();
  return Array.from({ length: 34 }, (_, i) => {
    const [name, phone, area, pincode] = NAMES[i % NAMES.length];
    const status = STATUSES[i % STATUSES.length];
    const createdAt = new Date(now - (i * 11 + (i % 3) * 2 + 0.5) * HOUR).toISOString();
    const items = [ITEMS[i % ITEMS.length], ITEMS[(i + 2) % ITEMS.length]]
      .slice(0, 1 + (i % 2))
      .map((it, j) => {
        const quantity = 1 + ((i + j) % 3);
        return { ...it, quantity, lineTotalPaise: it.unitPricePaise * quantity };
      });
    const paid = status === "delivered" || (status === "confirmed" && i % 4 === 0);
    const events: AdminOrderEvent[] = [
      {
        id: `e${i}-0`,
        type: "created",
        fromValue: null,
        toValue: "new",
        byOwner: false,
        createdAt,
      },
    ];
    if (status !== "new") {
      events.push({
        id: `e${i}-1`,
        type: "status",
        fromValue: "new",
        toValue: status === "cancelled" ? "cancelled" : "confirmed",
        byOwner: true,
        createdAt: new Date(Date.parse(createdAt) + HOUR).toISOString(),
      });
    }
    return {
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      reference: `KS-${10434 - i}`,
      status,
      customerName: name,
      phone,
      whatsappOk: i % 5 !== 0,
      email: i % 3 === 0 ? `${name.split(" ")[0].toLowerCase()}@example.com` : null,
      addressLine1: `Flat ${100 + i}, Sample Residency`,
      addressLine2: `${area} Road, ${area}`,
      landmark: i % 4 === 0 ? "Near the temple" : null,
      pincode,
      city: "Pune",
      state: "Maharashtra",
      pincodeServiceable: i % 6 !== 5,
      slot: (["morning", "daytime", "evening"] as const)[i % 3],
      note: i % 5 === 1 ? "Please call before coming, gate is locked till 7 am." : null,
      totalPaise: items.reduce((s, it) => s + it.lineTotalPaise, 0),
      paymentStatus: paid ? "paid" : "unpaid",
      paymentMethod: paid ? (i % 2 ? "upi" : "cash") : null,
      cancelReason: status === "cancelled" ? "Travelling — will reorder next week" : null,
      ownerNote: null,
      createdAt,
      items,
      events,
    } satisfies AdminOrderDetail;
  });
}

const globalStore = globalThis as unknown as { __ksheeraDemoOrders?: AdminOrderDetail[] };
const store = () => (globalStore.__ksheeraDemoOrders ??= seed());

function matches(o: AdminOrderDetail, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    o.customerName.toLowerCase().includes(q) ||
    o.reference.toLowerCase().includes(q) ||
    (digits !== "" && o.phone.includes(digits))
  );
}

function inWindow(o: AdminOrderDetail, from: Date | null, to: Date | null) {
  const t = Date.parse(o.createdAt);
  return (!from || t >= from.getTime()) && (!to || t < to.getTime());
}

function find(id: string) {
  const order = store().find((o) => o.id === id);
  if (!order) throw new OwnerActionError("Order not found.");
  return order;
}

function log(
  order: AdminOrderDetail,
  event: Omit<AdminOrderEvent, "id" | "createdAt" | "byOwner">,
) {
  order.events.push({
    ...event,
    id: `e-${order.events.length}-${Date.now()}`,
    byOwner: true,
    createdAt: new Date().toISOString(),
  });
}

export function demoAdminRepo(): AdminRepo {
  return {
    async listOrders(filters, window, limit) {
      const rows = store()
        .filter((o) => inWindow(o, window.from, window.to))
        .filter((o) => !filters.status || o.status === filters.status)
        .filter((o) => matches(o, filters.search))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const start = (filters.page - 1) * limit;
      return {
        orders: rows.slice(start, start + limit).map(({ events: _events, ...o }) => o),
        hasMore: rows.length > start + limit,
      };
    },

    async getStats(window, search) {
      const all = store();
      const inRange = all.filter((o) => inWindow(o, window.from, window.to) && matches(o, search));
      const live = inRange.filter((o) => o.status !== "cancelled");
      const unpaid = live.filter((o) => o.paymentStatus === "unpaid");
      const count = (s: OrderStatus) => inRange.filter((o) => o.status === s).length;
      return {
        counts: {
          all: inRange.length,
          new: count("new"),
          confirmed: count("confirmed"),
          out_for_delivery: count("out_for_delivery"),
          delivered: count("delivered"),
          cancelled: count("cancelled"),
        },
        valuePaise: live.reduce((s, o) => s + o.totalPaise, 0),
        valueOrders: live.length,
        unpaidPaise: unpaid.reduce((s, o) => s + o.totalPaise, 0),
        unpaidOrders: unpaid.length,
        openNew: all.filter((o) => o.status === "new").length,
        openToDeliver: all.filter(
          (o) => o.status === "confirmed" || o.status === "out_for_delivery",
        ).length,
        openOutForDelivery: all.filter((o) => o.status === "out_for_delivery").length,
      } satisfies OrderStats;
    },

    async getOrder(id) {
      const order = store().find((o) => o.id === id);
      return order ? structuredClone(order) : null;
    },

    async updateStatus(id, status, cancelReason) {
      const order = find(id);
      if (!nextStatuses(order.status).includes(status)) {
        throw new OwnerActionError("That change isn't allowed from the order's current status.");
      }
      log(order, { type: "status", fromValue: order.status, toValue: status });
      order.status = status;
      if (status === "cancelled") order.cancelReason = cancelReason;
    },

    async updatePayment(id, paymentStatus, paymentMethod) {
      const order = find(id);
      log(order, {
        type: "payment",
        fromValue: `${order.paymentStatus}${order.paymentMethod ? `:${order.paymentMethod}` : ""}`,
        toValue: `${paymentStatus}${paymentMethod ? `:${paymentMethod}` : ""}`,
      });
      order.paymentStatus = paymentStatus;
      order.paymentMethod = paymentMethod;
    },

    async updateOwnerNote(id, note) {
      const order = find(id);
      if (order.ownerNote === note) return;
      log(order, { type: "owner_note", fromValue: null, toValue: null });
      order.ownerNote = note;
    },
  };
}
