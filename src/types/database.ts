/**
 * Database types matching supabase/migrations. Once a Supabase project is
 * linked, replace this file with generated types:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ProductCategory = "ghee" | "milk" | "paneer" | "dahi" | "makhan";
export type OrderStatus = "new" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "upi" | "cash" | "other";
export type DeliverySlot = "morning" | "daytime" | "evening";

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  name_hi: string | null;
  category: ProductCategory;
  short_desc: string | null;
  description: string | null;
  highlights: Json;
  details: Json;
  badge: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  label: string;
  price_paise: number;
  mrp_paise: number | null;
  sku: string | null;
  in_stock: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt: string;
  sort_order: number;
  created_at: string;
};

export type BannerRow = {
  id: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  theme_variant: "primary" | "surface" | "accent";
  image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  customer_name: string;
  city: string | null;
  product_id: string | null;
  rating: number;
  body: string;
  is_featured: boolean;
  published: boolean;
  created_at: string;
};

export type ServiceablePincodeRow = {
  pincode: string;
  area: string | null;
  city: string;
  is_active: boolean;
};

export type SettingRow = {
  key: string;
  value: Json;
  is_public: boolean;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  reference: string;
  status: OrderStatus;
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
  slot: DeliverySlot;
  note: string | null;
  subtotal_paise: number;
  delivery_paise: number;
  total_paise: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  cancel_reason: string | null;
  owner_note: string | null;
  consent_at: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
};

export type OrderEventRow = {
  id: string;
  order_id: string;
  type: "created" | "status" | "payment" | "owner_note";
  from_value: string | null;
  to_value: string | null;
  actor_id: string | null;
  created_at: string;
};

type WithDefaults<Row, Defaulted extends keyof Row> = Omit<Row, Defaulted> &
  Partial<Pick<Row, Defaulted>>;

export type Database = {
  public: {
    Tables: {
      products: Table<
        ProductRow,
        WithDefaults<
          ProductRow,
          | "id"
          | "name_hi"
          | "short_desc"
          | "description"
          | "highlights"
          | "details"
          | "badge"
          | "sort_order"
          | "is_active"
          | "created_at"
          | "updated_at"
        >
      >;
      product_variants: Table<
        ProductVariantRow,
        WithDefaults<
          ProductVariantRow,
          | "id"
          | "mrp_paise"
          | "sku"
          | "in_stock"
          | "is_default"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >
      >;
      product_images: Table<
        ProductImageRow,
        WithDefaults<ProductImageRow, "id" | "sort_order" | "created_at">
      >;
      banners: Table<
        BannerRow,
        WithDefaults<
          BannerRow,
          | "id"
          | "eyebrow"
          | "body"
          | "cta_label"
          | "cta_href"
          | "theme_variant"
          | "image_path"
          | "starts_at"
          | "ends_at"
          | "sort_order"
          | "is_active"
          | "created_at"
          | "updated_at"
        >
      >;
      reviews: Table<
        ReviewRow,
        WithDefaults<
          ReviewRow,
          "id" | "city" | "product_id" | "is_featured" | "published" | "created_at"
        >
      >;
      serviceable_pincodes: Table<
        ServiceablePincodeRow,
        WithDefaults<ServiceablePincodeRow, "area" | "is_active">
      >;
      settings: Table<SettingRow, WithDefaults<SettingRow, "is_public" | "updated_at">>;
      orders: Table<
        OrderRow,
        WithDefaults<
          OrderRow,
          | "id"
          | "reference"
          | "status"
          | "whatsapp_ok"
          | "email"
          | "landmark"
          | "pincode_serviceable"
          | "note"
          | "delivery_paise"
          | "payment_status"
          | "payment_method"
          | "cancel_reason"
          | "owner_note"
          | "source"
          | "created_at"
          | "updated_at"
        >
      >;
      order_items: Table<OrderItemRow, WithDefaults<OrderItemRow, "id" | "variant_id">>;
      order_events: Table<
        OrderEventRow,
        WithDefaults<OrderEventRow, "id" | "from_value" | "to_value" | "actor_id" | "created_at">
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_owner: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      product_category: ProductCategory;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      delivery_slot: DeliverySlot;
    };
    CompositeTypes: Record<string, never>;
  };
};
