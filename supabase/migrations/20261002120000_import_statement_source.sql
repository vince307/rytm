-- Expand-only widening for Santander CSV import (S-10): public.imports accepts a second source, and a new
-- public.import_statement() RPC writes it. Backward-compatible with the deploy window: the `deploy` job pushes
-- this migration minutes before the new code, so old code keeps calling public.import_ing_statement() with its
-- five named arguments and posting payloads without `source` — that function is untouched here, stays callable,
-- and still inserts the literal 'ing'. A later contract migration may drop it once no deployed code calls it
-- (not this slice).
--
-- Widened check: `imports_source_check` now allows ('ing', 'santander'). Any other value still raises 23514.
--
-- public.import_statement(p_source, …): the same body as import_ing_statement (same 22023 validations, same
-- insert column lists — no `user_id` in either list, so `user_id` comes only from the column default
-- `auth.uid()` and the RLS `with check` policies, never from the payload or an argument), except the insert
-- into public.imports carries p_source instead of the literal 'ing', and an unknown source is rejected by
-- imports_source_check (23514) rather than reaching this function (the check runs on the insert regardless).
-- security invoker (not definer): RLS, the user_id default, the exclusion constraint and the composite FK all
-- apply exactly as for a direct insert. Grants mirror import_ing_statement: execute is revoked from public and
-- anon (Supabase's default privileges would otherwise grant a new function EXECUTE to PUBLIC, which includes
-- anon) and granted to authenticated only.
--
-- No new table here, so the "always enable RLS on new tables" CLAUDE.md rule does not apply; the user_id
-- cascade (on delete cascade to auth.users) is unchanged from the existing imports/transactions tables.

alter table public.imports
  drop constraint imports_source_check,
  add constraint imports_source_check check (source in ('ing', 'santander'));

create function public.import_statement(
  p_source text,
  p_account_number text,
  p_account_name text,
  p_period_start date,
  p_period_end date,
  p_transactions jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_import_id uuid;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'import_statement requires an authenticated user'
      using errcode = '22023';
  end if;

  if p_transactions is null or jsonb_typeof(p_transactions) <> 'array' then
    raise exception 'p_transactions must be a JSON array'
      using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_transactions);
  if v_count < 1 or v_count > 5000 then
    raise exception 'p_transactions must hold 1..5000 elements, got %', v_count
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_transactions) as e
    where (e ->> 'occurred_on') is null
       or (e ->> 'occurred_on')::date not between p_period_start and p_period_end
  ) then
    raise exception 'every occurred_on must lie within [%, %]', p_period_start, p_period_end
      using errcode = '22023';
  end if;

  insert into public.imports (source, account_number, account_name, period_start, period_end)
  values (p_source, p_account_number, p_account_name, p_period_start, p_period_end)
  returning id into v_import_id;

  insert into public.transactions
    (import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty, title, details)
  select
    v_import_id,
    p_account_number,
    (e ->> 'occurred_on')::date,
    (e ->> 'amount_minor')::bigint,
    e ->> 'bank_tx_id',
    e ->> 'counterparty',
    coalesce(e ->> 'title', ''),
    e ->> 'details'
  from jsonb_array_elements(p_transactions) as e;

  return v_import_id;
end;
$$;

comment on function public.import_statement(text, text, text, date, date, jsonb) is
  'S-10: atomically inserts one import (source p_source, ''ing'' or ''santander'') and all its debits from a JSON array of {occurred_on, amount_minor, bank_tx_id, counterparty, title, details}; returns the import id. Security invoker (RLS and user_id default apply); user_id is never a parameter and never read from p_transactions. FR-005 is per bank account: an overlapping range of the same account raises 23P01 and leaves no rows. Invalid input (no auth.uid(), 0 or >5000 elements, date outside the range) raises 22023; an unknown source raises 23514. Callable only by the authenticated role. Expand-only alongside public.import_ing_statement(), which stays for the deploy window.';

revoke execute on function public.import_statement(text, text, text, date, date, jsonb) from public, anon;
grant execute on function public.import_statement(text, text, text, date, date, jsonb) to authenticated;
