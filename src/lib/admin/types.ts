import type {
  DeliverySlot,
  OrderEventRow,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database";
import type { OrderFilters } from "./filters";

export type AdminOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  whatsappOk: boolean;
  email: string | null;
  addressLine1: string;
  addressLine2: string;
  landmark: string | null;
  pincode: string;
  city: string;
  state: string;
  pincodeServiceable: boolean;
  slot: DeliverySlot;
  note: string | null;
  totalPaise: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  cancelReason: string | null;
  ownerNote: string | null;
  createdAt: string;
};

export type AdminOrderItem = {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
};

export type AdminOrderListItem = AdminOrder & { items: AdminOrderItem[] };

export type AdminOrderEvent = {
  id: string;
  type: OrderEventRow["type"];
  fromValue: string | null;
  toValue: string | null;
  /** True when the owner made the change (false for the website). */
  byOwner: boolean;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderListItem & { events: AdminOrderEvent[] };

export type OrderStats = {
  counts: Record<OrderStatus | "all", number>;
  valuePaise: number;
  valueOrders: number;
  unpaidPaise: number;
  unpaidOrders: number;
  openNew: number;
  openToDeliver: number;
  openOutForDelivery: number;
};

export type DateWindow = { from: Date | null; to: Date | null };

/** A problem the owner can act on, shown as is. */
export class OwnerActionError extends Error {}

/** Everything the dashboard reads and writes. Row-level security enforces access. */
export interface AdminRepo {
  listOrders(
    filters: OrderFilters,
    window: DateWindow,
    limit: number,
  ): Promise<{ orders: AdminOrderListItem[]; hasMore: boolean }>;
  getStats(window: DateWindow, search: string): Promise<OrderStats>;
  getOrder(id: string): Promise<AdminOrderDetail | null>;
  updateStatus(id: string, status: OrderStatus, cancelReason: string | null): Promise<void>;
  updatePayment(
    id: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod | null,
  ): Promise<void>;
  updateOwnerNote(id: string, note: string | null): Promise<void>;
}
