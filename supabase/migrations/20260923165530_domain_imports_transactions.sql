-- Domain data layer for S-01/S-02: one bank-account import with its date range, and its debits.
-- FR-002: every row belongs to one account (user_id) and RLS lets a signed-in user touch only their own rows.
-- FR-005: an import whose date range overlaps an existing import of the same bank account is rejected by
--         the database (exclusion constraint `imports_no_overlap`, SQLSTATE 23P01; S-01 maps it to a message).
-- FR-019: both tables cascade from auth.users, so delete_own_account() removes all of the caller's data;
--         transactions also cascade from their import (composite FK keeps import and transaction on one account).
--
-- No `update` policies: imports and transactions are immutable facts. A correction means deleting the
-- import (S-02) and importing again. No policies for `anon` either (denied by default), and its table
-- privileges are revoked as a second layer. Supabase's default grants would also give `authenticated`
-- TRUNCATE (which bypasses RLS for every account at once), TRIGGER and REFERENCES; those are revoked too.

create extension if not exists btree_gist with schema extensions;

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null check (source in ('ing')),
  -- Account number from the statement preamble, normalized (no spaces).
  account_number text not null,
  account_name text not null,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  -- Target of the composite FK from transactions.
  unique (id, user_id),
  constraint imports_no_overlap exclude using gist (
    user_id with =,
    account_number with =,
    daterange(period_start, period_end, '[]') with &&
  )
);

comment on table public.imports is
  'One imported bank statement of a single account and date range; FR-005 rejects overlapping ranges of the same account (imports_no_overlap).';

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  import_id uuid not null,
  -- Copy of imports.account_number, needed for the bank transaction key below.
  account_number text not null,
  -- ING "Data transakcji".
  occurred_on date not null,
  -- Debit in grosze as a positive number (-116,85 -> 11685).
  amount_minor bigint not null check (amount_minor > 0),
  -- ING "Nr transakcji" without quotes and spaces; null for banks without an id.
  bank_tx_id text,
  -- ING "Dane kontrahenta", "Tytuł", "Szczegóły".
  counterparty text not null,
  title text not null default '',
  details text,
  created_at timestamptz not null default now(),
  foreign key (import_id, user_id) references public.imports(id, user_id) on delete cascade
);

comment on table public.transactions is
  'Debits of an import (immutable facts); cascade with their import and account (FR-019), unique per account by bank transaction id.';

create unique index transactions_bank_tx_key
  on public.transactions (user_id, account_number, bank_tx_id)
  where bank_tx_id is not null;

create index transactions_import_id_idx on public.transactions (import_id);
create index transactions_user_id_occurred_on_idx on public.transactions (user_id, occurred_on);

-- RLS (FR-002): select/insert/delete for authenticated only, each limited to the caller's rows.
alter table public.imports enable row level security;
alter table public.transactions enable row level security;

create policy "imports: authenticated select own"
  on public.imports for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "imports: authenticated insert own"
  on public.imports for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "imports: authenticated delete own"
  on public.imports for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "transactions: authenticated select own"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "transactions: authenticated insert own"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "transactions: authenticated delete own"
  on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.imports, public.transactions from anon;
revoke truncate, trigger, references on public.imports, public.transactions from authenticated;
