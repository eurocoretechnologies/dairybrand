-- Tests for the owner dashboard functions. Runs after 02_place_order_test.sql.

\set QUIET on
\o /dev/null

create or replace function pg_temp.expect(ok boolean, what text) returns void
language plpgsql as $$
begin
  if not ok then raise exception 'FAILED: %', what; end if;
  raise notice 'ok - %', what;
end $$;

create or replace function pg_temp.expect_error(stmt text, what text) returns void
language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED (no error): %', what;
exception
  when others then
    if sqlerrm like 'FAILED%' then raise; end if;
    raise notice 'ok - %', what;
end $$;

-- A known set of orders for this test.
reset role;
truncate public.order_events, public.order_items, public.orders cascade;

insert into public.orders (customer_name, phone, address_line1, address_line2, pincode, city, state,
  slot, subtotal_paise, total_paise, consent_at, status, payment_status, cancel_reason, created_at)
values
  ('Priya Deshmukh', '9822041000', 'a', 'b', '411045', 'Pune', 'Maharashtra', 'morning', 100000, 100000, now(), 'new', 'unpaid', null, now() - interval '1 hour'),
  ('Rohan Mehta', '9930052000', 'a', 'b', '411038', 'Pune', 'Maharashtra', 'evening', 20000, 20000, now(), 'confirmed', 'paid', null, now() - interval '2 days'),
  ('Imran Shaikh', '9011077000', 'a', 'b', '411040', 'Pune', 'Maharashtra', 'morning', 50000, 50000, now(), 'out_for_delivery', 'unpaid', null, now() - interval '3 days'),
  ('Farah Khan', '9850034000', 'a', 'b', '411001', 'Pune', 'Maharashtra', 'morning', 70000, 70000, now(), 'cancelled', 'unpaid', 'Travelling', now() - interval '4 days'),
  ('Sneha Patil', '9881063000', 'a', 'b', '411014', 'Pune', 'Maharashtra', 'evening', 30000, 30000, now(), 'delivered', 'paid', null, now() - interval '40 days');

set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"owner"}}';

create temp table s7 as select public.order_stats(now() - interval '7 days', null, null) as s;
select pg_temp.expect((select (s -> 'counts' ->> 'all')::int = 4 from s7), '7-day range counts 4 orders');
select pg_temp.expect(
  (select (s -> 'counts' ->> 'new')::int = 1 and (s -> 'counts' ->> 'cancelled')::int = 1 from s7),
  'counts by status');
select pg_temp.expect(
  (select (s ->> 'value_paise')::int = 170000 and (s ->> 'value_orders')::int = 3 from s7),
  'order value excludes cancelled orders');
select pg_temp.expect(
  (select (s ->> 'unpaid_paise')::int = 150000 and (s ->> 'unpaid_orders')::int = 2 from s7),
  'unpaid amount excludes paid and cancelled orders');
select pg_temp.expect(
  (select (s ->> 'open_new')::int = 1 and (s ->> 'open_to_deliver')::int = 2 from s7),
  'open work ignores the date range');

select pg_temp.expect(
  (select (public.order_stats(null, null, null) -> 'counts' ->> 'all')::int = 5),
  'no range counts every order');
select pg_temp.expect(
  (select (public.order_stats(null, null, 'priya') -> 'counts' ->> 'all')::int = 1),
  'search matches name, ignoring case');
select pg_temp.expect(
  (select (public.order_stats(null, null, '99 300 52') -> 'counts' ->> 'all')::int = 1),
  'search matches phone digits, ignoring spaces');
select pg_temp.expect(
  (select (public.order_stats(null, null, 'ks-1') -> 'counts' ->> 'all')::int = 5),
  'search matches references');
select pg_temp.expect(
  (select array_agg(customer_name) = array['Priya Deshmukh', 'Rohan Mehta']
   from public.list_orders(null, null, null, null, 2, 0)),
  'list is newest first and paged');
select pg_temp.expect(
  (select array_agg(customer_name) = array['Imran Shaikh', 'Farah Khan']
   from public.list_orders(null, null, null, null, 2, 2)),
  'second page continues the list');
select pg_temp.expect(
  (select count(*) = 1 from public.list_orders(null, null, null, 'cancelled', 25, 0)),
  'filters by status');
select pg_temp.expect(
  (select count(*) = 0 from public.list_orders(null, null, 'Priya', 'delivered', 25, 0)),
  'combines search and status');
reset role;

set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","app_metadata":{}}';
select pg_temp.expect_error($q$select public.order_stats(null, null, null)$q$, 'non-owners are refused');
select pg_temp.expect(
  (select count(*) = 0 from public.list_orders(null, null, null, null, 25, 0)),
  'non-owners get an empty list');
reset role;

set role anon;
select pg_temp.expect_error($q$select public.order_stats(null, null, null)$q$, 'visitors are refused');
reset role;

\echo 'All owner dashboard tests passed.'
