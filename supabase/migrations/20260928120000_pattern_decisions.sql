-- Durable pattern decisions for S-05 (FR-009, US-03): a signed-in user merges one pattern into
-- another, excludes a pattern from the analysis (and restores it), pins its type (stały/częsty) and
-- renames it. Every decision is one row per (user_id, merchant_key) — never keyed on import_id (US-02
-- AC, the same invariant pattern_thresholds follows): a decision survives deletion of the import(s)
-- whose transactions formed the pattern, because it is attached to the merchant, not to any one import.
-- A merge is stored on the ABSORBED key's row (merged_into points at the surviving root); the root's own
-- row (if any) carries its own excluded / pinned_type / display_name independently.
--
-- Like pattern_thresholds (20260927200000_pattern_thresholds.sql) and unlike imports/transactions
-- (immutable facts, no update policy), this is a per-user MUTABLE table: the app writes it with
-- supabase-js upserts (`insert … on conflict (user_id, merchant_key) do update set <one column>`) that
-- PostgREST can only perform when `authenticated` holds both INSERT and UPDATE on the row. So this
-- migration keeps `revoke update` OUT of its final revoke list — copying it from the transactions
-- follow-up would make every upsert fail with 42501 the moment it needs the UPDATE branch.

create table public.pattern_decisions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- src/lib/patterns/merchant.ts merchantKey(): normalized, lower-cased (pl-PL) merchant name.
  merchant_key text not null check (char_length(merchant_key) between 1 and 500),
  -- The root key this row's pattern is merged into. Null = not merged (or the root itself).
  merged_into text null check (merged_into is null or char_length(merged_into) between 1 and 500),
  excluded boolean not null default false,
  pinned_type text null check (pinned_type in ('fixed', 'frequent')),
  display_name text null check (display_name is null or char_length(display_name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, merchant_key),
  constraint pattern_decisions_no_self_merge check (merged_into is null or merged_into <> merchant_key)
);

comment on table public.pattern_decisions is
  'FR-009/US-03: one durable decision row per (user, merchant key) — merge target, exclusion, pinned type, display name — mutable in place; survives deletion of the transactions'' import (US-02 AC) because it never references imports or transactions.';

alter table public.pattern_decisions enable row level security;

create policy "pattern_decisions: authenticated select own"
  on public.pattern_decisions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pattern_decisions: authenticated insert own"
  on public.pattern_decisions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pattern_decisions: authenticated update own"
  on public.pattern_decisions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "pattern_decisions: authenticated delete own"
  on public.pattern_decisions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.pattern_decisions from anon;
revoke truncate, trigger, references, maintain on public.pattern_decisions from authenticated;
