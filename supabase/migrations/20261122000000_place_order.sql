-- Order requests: one transactional function that re-prices from the
-- database, blocks duplicates and floods, and writes the order and its items.
-- Only the server (service role) may call it.

alter table public.orders
  add column request_fingerprint text,
  add column ip_hash text;

create index orders_phone_created_idx on public.orders (phone, created_at desc);
create index orders_ip_hash_created_idx on public.orders (ip_hash, created_at desc)
  where ip_hash is not null;

-- p_customer: { customer_name, phone, whatsapp_ok, email, address_line1,
--   address_line2, landmark, pincode, city, state, slot, note }
-- p_items: [{ "variant_id": uuid, "quantity": int }, …]
-- p_ip_hash: salted hash of the client IP, or null
--
-- Errors are raised with messages starting "order:" so the app can map them:
--   order:empty_cart, order:too_many_items, order:bad_quantity,
--   order:unavailable_item, order:rate_limited_phone, order:rate_limited_ip
create or replace function public.place_order(p_customer jsonb, p_items jsonb, p_ip_hash text)
returns table (order_id uuid, reference text, is_duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := p_customer ->> 'phone';
  v_fingerprint text;
  v_subtotal integer;
  v_requested integer;
  v_available integer;
  v_order public.orders%rowtype;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order:empty_cart';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'order:too_many_items';
  end if;

  -- Merge repeated variants and check quantities.
  if to_regclass('pg_temp._req') is not null then
    drop table _req;
  end if;
  create temporary table _req on commit drop as
    select (e ->> 'variant_id')::uuid as variant_id, sum((e ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(p_items) as e
    group by 1;

  if exists (select 1 from _req where quantity is null or quantity < 1 or quantity > 20) then
    raise exception 'order:bad_quantity';
  end if;

  -- Every variant must exist, be in stock and belong to an active product.
  select count(*) into v_requested from _req;
  select count(*) into v_available
  from _req r
  join public.product_variants v on v.id = r.variant_id and v.in_stock
  join public.products p on p.id = v.product_id and p.is_active;
  if v_available <> v_requested then
    raise exception 'order:unavailable_item';
  end if;

  select string_agg(variant_id::text || 'x' || quantity, ',' order by variant_id)
    into v_fingerprint from _req;

  -- The same request from the same phone within 10 minutes returns the first order.
  select * into v_order
  from public.orders o
  where o.phone = v_phone
    and o.request_fingerprint = v_fingerprint
    and o.status <> 'cancelled'
    and o.created_at > now() - interval '10 minutes'
  order by o.created_at desc
  limit 1;
  if found then
    return query select v_order.id, v_order.reference, true;
    return;
  end if;

  -- Flood limits: 5 per phone and 10 per IP per hour.
  if (select count(*) from public.orders o
      where o.phone = v_phone and o.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'order:rate_limited_phone';
  end if;
  if p_ip_hash is not null and (select count(*) from public.orders o
      where o.ip_hash = p_ip_hash and o.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'order:rate_limited_ip';
  end if;

  select sum(v.price_paise * r.quantity) into v_subtotal
  from _req r join public.product_variants v on v.id = r.variant_id;

  insert into public.orders (
    customer_name, phone, whatsapp_ok, email,
    address_line1, address_line2, landmark, pincode, city, state,
    pincode_serviceable, slot, note,
    subtotal_paise, delivery_paise, total_paise,
    consent_at, request_fingerprint, ip_hash
  ) values (
    trim(p_customer ->> 'customer_name'),
    v_phone,
    coalesce((p_customer ->> 'whatsapp_ok')::boolean, true),
    nullif(trim(p_customer ->> 'email'), ''),
    trim(p_customer ->> 'address_line1'),
    trim(p_customer ->> 'address_line2'),
    nullif(trim(p_customer ->> 'landmark'), ''),
    p_customer ->> 'pincode',
    trim(p_customer ->> 'city'),
    p_customer ->> 'state',
    exists (select 1 from public.serviceable_pincodes s
            where s.pincode = p_customer ->> 'pincode' and s.is_active),
    (p_customer ->> 'slot')::public.delivery_slot,
    nullif(trim(p_customer ->> 'note'), ''),
    v_subtotal, 0, v_subtotal,
    now(), v_fingerprint, p_ip_hash
  )
  returning * into v_order;

  insert into public.order_items (
    order_id, variant_id, product_name, variant_label, unit_price_paise, quantity, line_total_paise
  )
  select v_order.id, v.id, p.name, v.label, v.price_paise, r.quantity, v.price_paise * r.quantity
  from _req r
  join public.product_variants v on v.id = r.variant_id
  join public.products p on p.id = v.product_id
  order by p.sort_order, v.sort_order;

  return query select v_order.id, v_order.reference, false;
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text) to service_role;
