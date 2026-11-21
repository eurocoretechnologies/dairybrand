-- Ksheera storefront v1: catalogue, order requests, owner access.
-- Money is stored in paise (integer). Timestamps are UTC (timestamptz).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.product_category as enum ('ghee', 'milk', 'paneer', 'dahi', 'makhan');
create type public.order_status as enum ('new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid');
create type public.payment_method as enum ('upi', 'cash', 'other');
create type public.delivery_slot as enum ('morning', 'daytime', 'evening');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- An owner is a Supabase Auth user whose app_metadata.role is 'owner'.
-- app_metadata can only be set with the service role, never by the user.
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'owner', false);
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  name_hi text,
  category public.product_category not null,
  short_desc text,
  description text,
  highlights jsonb not null default '[]'::jsonb,   -- [{ "title": "A2", "body": "Gir cow milk" }]
  details jsonb not null default '[]'::jsonb,      -- [{ "title": "Storage", "body": "…" }]
  badge text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,                             -- "500 ml"
  price_paise integer not null check (price_paise > 0),
  mrp_paise integer check (mrp_paise is null or mrp_paise >= price_paise),
  sku text unique,
  in_stock boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_variants_product_id_idx on public.product_variants (product_id);
create unique index product_variants_one_default_idx
  on public.product_variants (product_id) where is_default;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,                      -- path inside the product-images bucket
  alt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  title text not null,
  body text,
  cta_label text,
  cta_href text,
  theme_variant text not null default 'primary'
    check (theme_variant in ('primary', 'surface', 'accent')),
  image_path text,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  city text,
  product_id uuid references public.products (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 600),
  is_featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.serviceable_pincodes (
  pincode text primary key check (pincode ~ '^[1-9][0-9]{5}$'),
  area text,
  city text not null,
  is_active boolean not null default true
);

-- Key/value site settings. Only rows with is_public = true are readable by
-- visitors; owner email and similar stay server-side.
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_reference_seq start with 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('KS-' || nextval('public.order_reference_seq')::text),
  status public.order_status not null default 'new',

  customer_name text not null check (char_length(customer_name) between 2 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  whatsapp_ok boolean not null default true,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  address_line1 text not null check (char_length(address_line1) between 1 and 120),
  address_line2 text not null check (char_length(address_line2) between 1 and 120),
  landmark text check (landmark is null or char_length(landmark) <= 120),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  city text not null check (char_length(city) between 1 and 120),
  state text not null,
  pincode_serviceable boolean not null default false,

  slot public.delivery_slot not null,
  note text check (note is null or char_length(note) <= 500),

  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_paise integer not null default 0 check (delivery_paise >= 0),
  total_paise integer not null check (total_paise = subtotal_paise + delivery_paise),

  payment_status public.payment_status not null default 'unpaid',
  payment_method public.payment_method,

  cancel_reason text,
  owner_note text check (owner_note is null or char_length(owner_note) <= 1000),

  consent_at timestamptz not null,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (status <> 'cancelled' or cancel_reason is not null)
);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_phone_idx on public.orders (phone);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,                      -- copied at order time
  variant_label text not null,                     -- copied at order time
  unit_price_paise integer not null check (unit_price_paise > 0),
  quantity integer not null check (quantity between 1 and 20),
  line_total_paise integer not null check (line_total_paise = unit_price_paise * quantity)
);
create index order_items_order_id_idx on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null check (type in ('created', 'status', 'payment', 'owner_note')),
  from_value text,
  to_value text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_id_idx on public.order_events (order_id, created_at);

-- Status lifecycle: new → confirmed → out_for_delivery → delivered;
-- new or confirmed → cancelled. Anything else is rejected.
create or replace function public.check_order_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'new' and new.status in ('confirmed', 'cancelled')) or
      (old.status = 'confirmed' and new.status in ('out_for_delivery', 'cancelled')) or
      (old.status = 'out_for_delivery' and new.status = 'delivered')
    ) then
      raise exception 'Order % cannot move from % to %', old.reference, old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

-- Writes the activity log. SECURITY DEFINER so the log is written even though
-- owners have no insert grant on order_events.
create or replace function public.log_order_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, type, to_value, actor_id)
    values (new.id, 'created', new.status::text, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_events (order_id, type, from_value, to_value, actor_id)
    values (new.id, 'status', old.status::text, new.status::text, auth.uid());
  end if;

  if new.payment_status is distinct from old.payment_status
     or new.payment_method is distinct from old.payment_method then
    insert into public.order_events (order_id, type, from_value, to_value, actor_id)
    values (
      new.id, 'payment',
      old.payment_status::text || coalesce(':' || old.payment_method::text, ''),
      new.payment_status::text || coalesce(':' || new.payment_method::text, ''),
      auth.uid()
    );
  end if;

  if new.owner_note is distinct from old.owner_note then
    insert into public.order_events (order_id, type, actor_id)
    values (new.id, 'owner_note', auth.uid());
  end if;

  return new;
end;
$$;

create trigger orders_check_status
  before update of status on public.orders
  for each row execute function public.check_order_status_transition();

create trigger orders_log_insert
  after insert on public.orders
  for each row execute function public.log_order_events();

create trigger orders_log_update
  after update on public.orders
  for each row execute function public.log_order_events();

-- updated_at triggers
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.banners enable row level security;
alter table public.reviews enable row level security;
alter table public.serviceable_pincodes enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- Public catalogue: visitors read active content only. No public writes.
create policy "Active products are public"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "Variants of active products are public"
  on public.product_variants for select to anon, authenticated
  using (exists (
    select 1 from public.products p where p.id = product_id and p.is_active
  ));

create policy "Images of active products are public"
  on public.product_images for select to anon, authenticated
  using (exists (
    select 1 from public.products p where p.id = product_id and p.is_active
  ));

create policy "Live banners are public"
  on public.banners for select to anon, authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

create policy "Published reviews are public"
  on public.reviews for select to anon, authenticated
  using (published);

create policy "Active pincodes are public"
  on public.serviceable_pincodes for select to anon, authenticated
  using (is_active);

create policy "Public settings are public"
  on public.settings for select to anon, authenticated
  using (is_public);

-- Orders: no direct access for visitors. Orders are inserted only by the
-- server (service role, which bypasses RLS). Owners read and update.
create policy "Owners read orders"
  on public.orders for select to authenticated
  using (public.is_owner());

create policy "Owners update orders"
  on public.orders for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "Owners read order items"
  on public.order_items for select to authenticated
  using (public.is_owner());

create policy "Owners read order events"
  on public.order_events for select to authenticated
  using (public.is_owner());

-- Owners may change only the fields the dashboard manages.
revoke insert, update, delete on public.orders from anon, authenticated;
grant update (status, payment_status, payment_method, cancel_reason, owner_note)
  on public.orders to authenticated;
revoke insert, update, delete on public.order_items from anon, authenticated;
revoke insert, update, delete on public.order_events from anon, authenticated;

-- Catalogue tables are read-only for clients; the dev team edits them with
-- the service role (Supabase Studio or scripts).
revoke insert, update, delete on
  public.products, public.product_variants, public.product_images,
  public.banners, public.reviews, public.serviceable_pincodes, public.settings
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for product and banner images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
