-- Per-pattern thresholds for S-04 (FR-010, FR-011): a signed-in user sets one threshold on a merchant
-- pattern (frequent: count or sum per month; fixed: accepted amount) and sees which transactions and
-- monthly sums are "ponad próg". Keyed on (user_id, merchant_key), never on import_id (US-02 AC): a
-- threshold survives deletion of the import(s) whose transactions formed the pattern, because it is
-- attached to the merchant, not to any one import.
--
-- Unlike imports/transactions (immutable facts, no update policy — see
-- 20260924122144_transactions_import_account_fk.sql), this is the first per-user MUTABLE table: FR-010
-- lets the user change a threshold in place, and the app writes it with a supabase-js upsert
-- (`insert … on conflict (user_id, merchant_key) do update`) that PostgREST can only perform when
-- `authenticated` holds both INSERT and UPDATE on the row. So this migration keeps `revoke update` OUT of
-- its final revoke list — copying it from the transactions follow-up would make every upsert fail with
-- 42501 the moment it needs the UPDATE branch.

create table public.pattern_thresholds (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- src/lib/patterns/merchant.ts merchantKey(): normalized, lower-cased (pl-PL) merchant name.
  merchant_key text not null check (char_length(merchant_key) between 1 and 500),
  kind text not null check (kind in ('count', 'sum', 'amount')),
  -- count: whole occurrences per month (integer). sum / amount: grosze, capped at 1 000 000 zl.
  value bigint not null check (value > 0 and value <= 100000000),
  created_at timestamptz not null default now(),
  unique (user_id, merchant_key)
);

comment on table public.pattern_thresholds is
  'FR-010/FR-011: one threshold per (user, merchant key), mutable in place; survives deletion of the transactions'' import (US-02 AC) because it never references imports or transactions.';

alter table public.pattern_thresholds enable row level security;

create policy "pattern_thresholds: authenticated select own"
  on public.pattern_thresholds for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pattern_thresholds: authenticated insert own"
  on public.pattern_thresholds for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pattern_thresholds: authenticated update own"
  on public.pattern_thresholds for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "pattern_thresholds: authenticated delete own"
  on public.pattern_thresholds for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.pattern_thresholds from anon;
revoke truncate, trigger, references, maintain on public.pattern_thresholds from authenticated;
