-- Tests for public.place_order. Runs after 01_rls_test.sql on the same database.

\set QUIET on
\o /dev/null

create or replace function pg_temp.expect(ok boolean, what text) returns void
language plpgsql as $$
begin
  if not ok then raise exception 'FAILED: %', what; end if;
  raise notice 'ok - %', what;
end $$;

create or replace function pg_temp.expect_error(stmt text, message text, what text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED (no error): %', what;
exception
  when others then
    if sqlerrm like 'FAILED%' then raise; end if;
    if message is not null and sqlerrm <> message then
      raise exception 'FAILED: % (got "%")', what, sqlerrm;
    end if;
    raise notice 'ok - %', what;
end $$;

create or replace function pg_temp.customer(phone text, pincode text default '411045') returns jsonb
language sql as $$
  select jsonb_build_object(
    'customer_name', '  Asha Patil ', 'phone', phone, 'whatsapp_ok', true, 'email', '',
    'address_line1', 'Flat 4, Test Apartments', 'address_line2', 'Baner Road',
    'landmark', '', 'pincode', pincode, 'city', 'Pune', 'state', 'Maharashtra',
    'slot', 'evening', 'note', 'Ring twice'
  )
$$;

create or replace function pg_temp.items(variadic pairs text[]) returns jsonb
language sql as $$
  -- pairs: 'sku:qty'
  select jsonb_agg(jsonb_build_object('variant_id', v.id, 'quantity', split_part(p, ':', 2)::int))
  from unnest(pairs) as p
  join public.product_variants v on v.sku = split_part(p, ':', 1)
$$;

set role service_role;

-- A normal order ------------------------------------------------------------
create temp table first_order as
  select * from public.place_order(
    pg_temp.customer('9123456780'),
    pg_temp.items('GHEE-A2-500:2', 'MILK-A2-1000:3'),
    'ip-a');

select pg_temp.expect((select not is_duplicate from first_order), 'places a new order');
select pg_temp.expect(
  (select subtotal_paise = 2 * 145000 + 3 * 11000 and total_paise = subtotal_paise
   from public.orders where id = (select order_id from first_order)),
  'totals come from database prices');
select pg_temp.expect(
  (select count(*) = 2 and sum(line_total_paise) = 2 * 145000 + 3 * 11000
   from public.order_items where order_id = (select order_id from first_order)),
  'writes one item per variant with snapshot prices');
select pg_temp.expect(
  (select customer_name = 'Asha Patil' and email is null and landmark is null
     and note = 'Ring twice' and pincode_serviceable and status = 'new'
   from public.orders where id = (select order_id from first_order)),
  'trims text, blanks become null, pincode marked serviceable');

-- Duplicate within 10 minutes returns the same order --------------------------
select pg_temp.expect(
  (select is_duplicate and reference = (select reference from first_order)
   from public.place_order(pg_temp.customer('9123456780'),
                           pg_temp.items('MILK-A2-1000:3', 'GHEE-A2-500:2'), 'ip-a')),
  'identical request (any item order) returns the first reference');
select pg_temp.expect(
  (select count(*) = 1 from public.orders where phone = '9123456780'),
  'duplicate does not create a second order');

-- Repeated variants are merged ------------------------------------------------
select pg_temp.expect(
  (select q = 3 from (
     select oi.quantity as q from public.place_order(
       pg_temp.customer('9123456781', '400001'),
       pg_temp.items('PANEER-200:1', 'PANEER-200:2'), null) po
     join public.order_items oi on oi.order_id = po.order_id) t),
  'merges repeated variants into one line');
select pg_temp.expect(
  (select not pincode_serviceable from public.orders where phone = '9123456781'),
  'unknown pincode is accepted but flagged');

-- Rejections --------------------------------------------------------------------
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456782'), '[]'::jsonb, null)$q$,
  'order:empty_cart', 'rejects an empty cart');
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456782'), pg_temp.items('DAHI-400:21'), null)$q$,
  'order:bad_quantity', 'rejects quantity above 20');
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456782'),
     jsonb_build_array(jsonb_build_object('variant_id', gen_random_uuid(), 'quantity', 1)), null)$q$,
  'order:unavailable_item', 'rejects unknown variants');

reset role;
update public.product_variants set in_stock = false where sku = 'DAHI-400';
update public.products set is_active = false where slug = 'white-makhan';
set role service_role;
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456782'), pg_temp.items('DAHI-400:1'), null)$q$,
  'order:unavailable_item', 'rejects out-of-stock variants');
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456782'), pg_temp.items('MAKHAN-200:1'), null)$q$,
  'order:unavailable_item', 'rejects variants of inactive products');
reset role;
update public.product_variants set in_stock = true where sku = 'DAHI-400';
update public.products set is_active = true where slug = 'white-makhan';
set role service_role;

select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('12345'), pg_temp.items('DAHI-400:1'), null)$q$,
  null, 'database constraints still reject a bad phone');

-- Flood limits ----------------------------------------------------------------
do $$
begin
  for i in 1..5 loop
    perform * from public.place_order(pg_temp.customer('9123456783'),
      pg_temp.items('DAHI-400:' || i), null);
  end loop;
end $$;
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456783'), pg_temp.items('DAHI-400:6'), null)$q$,
  'order:rate_limited_phone', 'limits 5 orders per phone per hour');

do $$
begin
  for i in 1..10 loop
    perform * from public.place_order(pg_temp.customer('98765400' || lpad(i::text, 2, '0')),
      pg_temp.items('DAHI-400:1'), 'ip-flood');
  end loop;
end $$;
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9876540099'), pg_temp.items('DAHI-400:1'), 'ip-flood')$q$,
  'order:rate_limited_ip', 'limits 10 orders per IP per hour');
reset role;

-- Only the server may place orders --------------------------------------------
set role anon;
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456784'), pg_temp.items('DAHI-400:1'), null)$q$,
  null, 'visitors cannot call place_order');
reset role;
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"owner"}}';
select pg_temp.expect_error(
  $q$select * from public.place_order(pg_temp.customer('9123456784'), pg_temp.items('DAHI-400:1'), null)$q$,
  null, 'owners cannot call place_order');
reset role;

\echo 'All place_order tests passed.'
