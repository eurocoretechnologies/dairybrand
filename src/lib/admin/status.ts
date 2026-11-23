import type { OrderStatus, PaymentMethod } from "@/types/database";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: "UPI",
  cash: "Cash",
  other: "Other",
};

/**
 * Where an order may move next. Mirrors the database trigger
 * (check_order_status_transition), which has the final say.
 */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "new":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["out_for_delivery", "cancelled"];
    case "out_for_delivery":
      return ["delivered"];
    case "delivered":
    case "cancelled":
      return [];
  }
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (STATUS_ORDER as string[]).includes(value);
}

/** Button text for moving an order to a status. */
export const STATUS_ACTIONS: Record<OrderStatus, string> = {
  new: "Mark as new",
  confirmed: "Mark confirmed",
  out_for_delivery: "Out for delivery",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};
