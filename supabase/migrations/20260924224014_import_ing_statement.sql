-- Atomic write of one ING statement import (S-01): public.import_ing_statement().
-- Atomicity: the import row and all its debits are inserted by one function call, i.e. one statement in
--   one transaction. Any rejection (validation below, or a constraint of the tables) aborts the whole call,
--   so no import without transactions and no orphaned transactions are ever left behind.
-- FR-005, per bank account: overlap is checked by imports_no_overlap on (user_id, account_number, range),
--   where account_number comes from the statement preamble. A second account from the same file (D1) can
--   be imported over the same dates; a new range of the same account that overlaps is rejected with 23P01
--   (decision of F-01, clarified in the PRD under FR-005).
-- security invoker: the function runs as the caller, so RLS (FR-002), the user_id default auth.uid(), the
--   exclusion constraint and the composite FK apply exactly as for direct inserts; no manual owner checks.
-- Validation before any insert raises SQLSTATE 22023 (invalid_parameter_value): missing auth.uid(), array
--   length outside 1..5000, or an occurred_on outside [p_period_start, p_period_end]. Constraint errors
--   (23P01 overlap, 23505 duplicate bank transaction id, 23514 check such as amount_minor > 0) pass through
--   unchanged for the endpoint to map.
-- Grants: execute is revoked from public and anon and granted to authenticated only (anon gets 42501).
-- No new tables here, so the "always enable RLS on new tables" rule from CLAUDE.md does not apply.

create or replace function public.import_ing_statement(
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
    raise exception 'import_ing_statement requires an authenticated user'
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
  values ('ing', p_account_number, p_account_name, p_period_start, p_period_end)
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

comment on function public.import_ing_statement(text, text, date, date, jsonb) is
  'S-01: atomically inserts one ING import (source ''ing'') and all its debits from a JSON array of {occurred_on, amount_minor, bank_tx_id, counterparty, title, details}; returns the import id. Security invoker (RLS and user_id default apply). FR-005 is per bank account: an overlapping range of the same account raises 23P01 and leaves no rows. Invalid input (no auth.uid(), 0 or >5000 elements, date outside the range) raises 22023. Callable only by the authenticated role.';

revoke execute on function public.import_ing_statement(text, text, date, date, jsonb) from public, anon;
grant execute on function public.import_ing_statement(text, text, date, date, jsonb) to authenticated;
