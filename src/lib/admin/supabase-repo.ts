import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import type { Json, OrderItemRow, OrderRow, OrderStatus } from "@/types/database";
import { STATUS_LABELS } from "./status";
import {
  OwnerActionError,
  type AdminOrder,
  type AdminOrderItem,
  type AdminRepo,
  type OrderStats,
} from "./types";

export function toAdminOrder(r: OrderRow): AdminOrder {
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    customerName: r.customer_name,
    phone: r.phone,
    whatsappOk: r.whatsapp_ok,
    email: r.email,
    addressLine1: r.address_line1,
    addressLine2: r.address_line2,
    landmark: r.landmark,
    pincode: r.pincode,
    city: r.city,
    state: r.state,
    pincodeServiceable: r.pincode_serviceable,
    slot: r.slot,
    note: r.note,
    totalPaise: r.total_paise,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    cancelReason: r.cancel_reason,
    ownerNote: r.owner_note,
    createdAt: r.created_at,
  };
}

const toItem = (
  i: Pick<
    OrderItemRow,
    "product_name" | "variant_label" | "quantity" | "unit_price_paise" | "line_total_paise"
  >,
): AdminOrderItem => ({
  productName: i.product_name,
  variantLabel: i.variant_label,
  quantity: i.quantity,
  unitPricePaise: i.unit_price_paise,
  lineTotalPaise: i.line_total_paise,
});

const num = (v: Json | undefined) => (typeof v === "number" ? v : Number(v ?? 0) || 0);

export function toStats(raw: Json): OrderStats {
  const o = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<
    string,
    Json
  >;
  const c = (
    o.counts && typeof o.counts === "object" && !Array.isArray(o.counts) ? o.counts : {}
  ) as Record<string, Json>;
  return {
    counts: {
      all: num(c.all),
      new: num(c.new),
      confirmed: num(c.confirmed),
      out_for_delivery: num(c.out_for_delivery),
      delivered: num(c.delivered),
      cancelled: num(c.cancelled),
    },
    valuePaise: num(o.value_paise),
    valueOrders: num(o.value_orders),
    unpaidPaise: num(o.unpaid_paise),
    unpaidOrders: num(o.unpaid_orders),
    openNew: num(o.open_new),
    openToDeliver: num(o.open_to_deliver),
    openOutForDelivery: num(o.open_out_for_delivery),
  };
}

function friendlyUpdateError(message: string | undefined, status?: OrderStatus): never {
  if (message?.includes("cannot move from")) {
    throw new OwnerActionError(
      status
        ? `This order can't be moved to "${STATUS_LABELS[status]}" from its current status. Refresh to see the latest.`
        : "That change isn't allowed from the order's current status.",
    );
  }
  console.error("Owner update failed:", message);
  throw new OwnerActionError("Couldn't save the change. Check your connection and try again.");
}

/** Reads and writes as the signed-in owner; row-level security does the rest. */
export function supabaseAdminRepo(): AdminRepo {
  const client = () => createSessionClient();

  return {
    async listOrders(filters, window, limit) {
      const supabase = await client();
      const { data, error } = await supabase.rpc("list_orders", {
        p_from: window.from?.toISOString() ?? null,
        p_to: window.to?.toISOString() ?? null,
        p_search: filters.search || null,
        p_status: filters.status,
        p_limit: limit + 1,
        p_offset: (filters.page - 1) * limit,
      });
      if (error) throw new Error(`list_orders failed: ${error.message}`);
      const rows = data.slice(0, limit);
      const ids = rows.map((r) => r.id);
      const { data: items, error: itemsError } = ids.length
        ? await supabase
            .from("order_items")
            .select(
              "order_id, product_name, variant_label, quantity, unit_price_paise, line_total_paise",
            )
            .in("order_id", ids)
        : { data: [], error: null };
      if (itemsError) throw new Error(`order_items failed: ${itemsError.message}`);
      return {
        orders: rows.map((r) => ({
          ...toAdminOrder(r),
          items: items.filter((i) => i.order_id === r.id).map(toItem),
        })),
        hasMore: data.length > limit,
      };
    },

    async getStats(window, search) {
      const supabase = await client();
      const { data, error } = await supabase.rpc("order_stats", {
        p_from: window.from?.toISOString() ?? null,
        p_to: window.to?.toISOString() ?? null,
        p_search: search || null,
      });
      if (error) throw new Error(`order_stats failed: ${error.message}`);
      return toStats(data);
    },

    async getOrder(id) {
      const supabase = await client();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, items:order_items(product_name, variant_label, quantity, unit_price_paise, line_total_paise), " +
            "events:order_events(id, type, from_value, to_value, actor_id, created_at)",
        )
        .eq("id", id)
        .maybeSingle()
        .returns<
          | (OrderRow & {
              items: Pick<
                OrderItemRow,
                | "product_name"
                | "variant_label"
                | "quantity"
                | "unit_price_paise"
                | "line_total_paise"
              >[];
              events: {
                id: string;
                type: "created" | "status" | "payment" | "owner_note";
                from_value: string | null;
                to_value: string | null;
                actor_id: string | null;
                created_at: string;
              }[];
            })
          | null
        >();
      if (error) throw new Error(`order failed: ${error.message}`);
      if (!data) return null;
      return {
        ...toAdminOrder(data),
        items: data.items.map(toItem),
        events: [...data.events]
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((e) => ({
            id: e.id,
            type: e.type,
            fromValue: e.from_value,
            toValue: e.to_value,
            byOwner: e.actor_id !== null,
            createdAt: e.created_at,
          })),
      };
    },

    async updateStatus(id, status, cancelReason) {
      const supabase = await client();
      const { error, count } = await supabase
        .from("orders")
        .update(status === "cancelled" ? { status, cancel_reason: cancelReason } : { status }, {
          count: "exact",
        })
        .eq("id", id);
      if (error) friendlyUpdateError(error.message, status);
      if (count === 0) throw new OwnerActionError("Order not found.");
    },

    async updatePayment(id, paymentStatus, paymentMethod) {
      const supabase = await client();
      const { error, count } = await supabase
        .from("orders")
        .update(
          { payment_status: paymentStatus, payment_method: paymentMethod },
          { count: "exact" },
        )
        .eq("id", id);
      if (error) friendlyUpdateError(error.message);
      if (count === 0) throw new OwnerActionError("Order not found.");
    },

    async updateOwnerNote(id, note) {
      const supabase = await client();
      const { error, count } = await supabase
        .from("orders")
        .update({ owner_note: note }, { count: "exact" })
        .eq("id", id);
      if (error) friendlyUpdateError(error.message);
      if (count === 0) throw new OwnerActionError("Order not found.");
    },
  };
}
