-- Access-rule and order-lifecycle tests. Run on a database with
-- supabase_stubs.sql, the migrations and seed.sql applied:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Every check raises an exception on failure, so the script stops at the
-- first broken rule.

\set QUIET on
\o /dev/null

-- Helpers -------------------------------------------------------------------
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
  when raise_exception then raise;
  when others then raise notice 'ok - %', what;
end $$;

-- A sample order, inserted as the server would (service role) ---------------
set role service_role;
insert into public.orders (
  customer_name, phone, address_line1, address_line2, pincode, city, state,
  slot, subtotal_paise, total_paise, consent_at
) values (
  'Test Customer', '9876543210', 'B-402 Test Residency', 'Test Road', '411045',
  'Pune', 'Maharashtra', 'morning', 145000, 145000, now()
);
insert into public.order_items (order_id, product_name, variant_label, unit_price_paise, quantity, line_total_paise)
select id, 'A2 Gir Cow Ghee', '500 ml', 145000, 1, 145000 from public.orders;
reset role;

select pg_temp.expect(
  (select reference from public.orders limit 1) = 'KS-10001',
  'first order reference is KS-10001');
select pg_temp.expect(
  (select count(*) from public.order_events where type = 'created') = 1,
  'creating an order logs a created event');

-- Visitors (anon) ------------------------------------------------------------
set role anon;
select pg_temp.expect((select count(*) from public.products) = 6, 'anon reads active products');
select pg_temp.expect((select count(*) from public.product_variants) = 8, 'anon reads variants');
select pg_temp.expect((select count(*) from public.banners) = 3, 'anon reads live banners');
select pg_temp.expect((select count(*) from public.reviews) = 3, 'anon reads published reviews');
select pg_temp.expect(
  not exists (select 1 from public.settings where key = 'owner_email'),
  'anon cannot read private settings');
select pg_temp.expect(
  exists (select 1 from public.settings where key = 'palette'),
  'anon reads the palette setting');
select pg_temp.expect((select count(*) from public.orders) = 0, 'anon sees no orders');
select pg_temp.expect((select count(*) from public.order_items) = 0, 'anon sees no order items');
select pg_temp.expect_error(
  $q$insert into public.orders (customer_name, phone, address_line1, address_line2, pincode, city, state, slot, subtotal_paise, total_paise, consent_at)
     values ('Spam', '9876543210', 'x', 'y', '411045', 'Pune', 'Maharashtra', 'morning', 0, 0, now())$q$,
  'anon cannot insert orders directly');
select pg_temp.expect_error(
  $q$update public.products set name = 'Hacked'$q$,
  'anon cannot edit products');
reset role;

-- Inactive content stays hidden ----------------------------------------------
update public.products set is_active = false where slug = 'white-makhan';
set role anon;
select pg_temp.expect((select count(*) from public.products) = 5, 'inactive products are hidden');
select pg_temp.expect((select count(*) from public.product_variants) = 7, 'variants of inactive products are hidden');
reset role;
update public.products set is_active = true where slug = 'white-makhan';

-- A signed-in user who is not an owner ---------------------------------------
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002","app_metadata":{}}';
select pg_temp.expect((select count(*) from public.orders) = 0, 'non-owner user sees no orders');
reset role;

-- The owner ------------------------------------------------------------------
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"owner"}}';
select pg_temp.expect((select count(*) from public.orders) = 1, 'owner reads orders');
select pg_temp.expect((select count(*) from public.order_items) = 1, 'owner reads order items');

update public.orders set status = 'confirmed';
select pg_temp.expect((select status from public.orders) = 'confirmed', 'owner confirms an order');

update public.orders set payment_status = 'paid', payment_method = 'upi';
update public.orders set owner_note = 'Called, will deliver tomorrow';
select pg_temp.expect(
  (select count(*) from public.order_events) = 4,
  'status, payment and note changes are each logged');
select pg_temp.expect(
  (select actor_id from public.order_events where type = 'status')
    = '00000000-0000-0000-0000-000000000001',
  'log records who made the change');

select pg_temp.expect_error(
  $q$update public.orders set status = 'new'$q$,
  'owner cannot move an order backwards');
select pg_temp.expect_error(
  $q$update public.orders set status = 'cancelled', cancel_reason = null$q$,
  'cancelling needs a reason');
select pg_temp.expect_error(
  $q$update public.orders set total_paise = 1$q$,
  'owner cannot change order totals');
select pg_temp.expect_error(
  $q$update public.orders set phone = '9999999999'$q$,
  'owner cannot change customer details');
select pg_temp.expect_error(
  $q$update public.products set name = 'Renamed'$q$,
  'owner cannot edit products');
select pg_temp.expect_error(
  $q$insert into public.order_events (order_id, type) select id, 'status' from public.orders$q$,
  'owner cannot write the activity log directly');
select pg_temp.expect(
  not exists (select 1 from public.settings where key = 'owner_email'),
  'owner cannot read private settings');

update public.orders set status = 'out_for_delivery';
update public.orders set status = 'delivered';
select pg_temp.expect((select status from public.orders) = 'delivered', 'full lifecycle reaches delivered');
reset role;

-- Data checks ----------------------------------------------------------------
select pg_temp.expect_error(
  $q$insert into public.orders (customer_name, phone, address_line1, address_line2, pincode, city, state, slot, subtotal_paise, total_paise, consent_at)
     values ('Bad Phone', '12345', 'x', 'y', '411045', 'Pune', 'Maharashtra', 'morning', 0, 0, now())$q$,
  'invalid phone numbers are rejected');
select pg_temp.expect_error(
  $q$insert into public.orders (customer_name, phone, address_line1, address_line2, pincode, city, state, slot, subtotal_paise, total_paise, consent_at)
     values ('Bad Total', '9876543210', 'x', 'y', '411045', 'Pune', 'Maharashtra', 'morning', 100, 50, now())$q$,
  'total must equal subtotal plus delivery');
select pg_temp.expect_error(
  $q$insert into public.order_items (order_id, product_name, variant_label, unit_price_paise, quantity, line_total_paise)
     select id, 'X', 'Y', 100, 21, 2100 from public.orders$q$,
  'quantity is capped at 20');

\echo 'All database tests passed.'
