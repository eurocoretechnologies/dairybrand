-- Owner dashboard: summary numbers in one call, and realtime new-order alerts.

-- Same search the orders list uses: name or reference contains the text, or
-- the phone number contains the digits.
create or replace function public.order_matches_search(o public.orders, p_search text)
returns boolean
language sql
immutable
as $$
  select p_search is null
    or btrim(p_search) = ''
    or o.customer_name ilike '%' || btrim(p_search) || '%'
    or o.reference ilike '%' || btrim(p_search) || '%'
    or (regexp_replace(p_search, '\D', '', 'g') <> ''
        and o.phone like '%' || regexp_replace(p_search, '\D', '', 'g') || '%');
$$;

-- Summary for the dashboard. Runs with the caller's rights, so row-level
-- security applies; it also refuses anyone who is not an owner.
--   p_from / p_to: created_at range (either may be null)
--   p_search: optional name, phone or reference text
create or replace function public.order_stats(p_from timestamptz, p_to timestamptz, p_search text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_owner() then
    raise exception 'order:not_owner' using errcode = '42501';
  end if;

  with in_range as (
    select * from public.orders o
    where (p_from is null or o.created_at >= p_from)
      and (p_to is null or o.created_at < p_to)
      and public.order_matches_search(o, p_search)
  )
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'all', (select count(*) from in_range),
      'new', (select count(*) from in_range where status = 'new'),
      'confirmed', (select count(*) from in_range where status = 'confirmed'),
      'out_for_delivery', (select count(*) from in_range where status = 'out_for_delivery'),
      'delivered', (select count(*) from in_range where status = 'delivered'),
      'cancelled', (select count(*) from in_range where status = 'cancelled')
    ),
    'value_paise', (select coalesce(sum(total_paise), 0) from in_range where status <> 'cancelled'),
    'value_orders', (select count(*) from in_range where status <> 'cancelled'),
    'unpaid_paise', (select coalesce(sum(total_paise), 0) from in_range
                     where status <> 'cancelled' and payment_status = 'unpaid'),
    'unpaid_orders', (select count(*) from in_range
                      where status <> 'cancelled' and payment_status = 'unpaid'),
    -- Work waiting right now, whatever the date filter.
    'open_new', (select count(*) from public.orders where status = 'new'),
    'open_to_deliver', (select count(*) from public.orders
                        where status in ('confirmed', 'out_for_delivery')),
    'open_out_for_delivery', (select count(*) from public.orders where status = 'out_for_delivery')
  ) into result;

  return result;
end;
$$;

revoke all on function public.order_stats(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.order_stats(timestamptz, timestamptz, text) to authenticated;

-- The orders list, newest first, with the same filters as order_stats.
-- Row-level security applies, so only owners get rows.
create or replace function public.list_orders(
  p_from timestamptz,
  p_to timestamptz,
  p_search text,
  p_status public.order_status,
  p_limit integer,
  p_offset integer
)
returns setof public.orders
language sql
stable
security invoker
set search_path = public
as $$
  select o.* from public.orders o
  where (p_from is null or o.created_at >= p_from)
    and (p_to is null or o.created_at < p_to)
    and (p_status is null or o.status = p_status)
    and public.order_matches_search(o, p_search)
  order by o.created_at desc, o.reference desc
  limit least(greatest(coalesce(p_limit, 25), 1), 5000)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.list_orders(timestamptz, timestamptz, text, public.order_status, integer, integer)
  from public, anon;
grant execute on function public.list_orders(timestamptz, timestamptz, text, public.order_status, integer, integer)
  to authenticated;

-- Realtime: owners receive inserts and updates on orders (row-level security
-- still decides who sees what).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
