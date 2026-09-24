-- Follow-up to 20260923165530_domain_imports_transactions.sql (impl-review F1, F4).
-- F1: transactions.account_number was documented as a copy of its import's account number but nothing
--     enforced it, so a direct PostgREST write could store a different number under its own import and
--     sidestep transactions_bank_tx_key. The composite FK now includes account_number, which makes the
--     copy a database guarantee; the old (id, user_id) key existed only for the previous FK.
-- F4: imports and transactions are immutable facts with no update policy; revoking UPDATE (and the
--     Postgres 17 MAINTAIN privilege) from authenticated turns a silent 0-row update into 42501.
-- Tables are still empty on production when this ships, so no data has to be checked or moved.

alter table public.transactions drop constraint transactions_import_id_user_id_fkey;
alter table public.imports drop constraint imports_id_user_id_key;

alter table public.imports
  add constraint imports_id_user_id_account_number_key unique (id, user_id, account_number);

alter table public.transactions
  add constraint transactions_import_account_fkey
  foreign key (import_id, user_id, account_number)
  references public.imports (id, user_id, account_number)
  on delete cascade;

revoke update, maintain on public.imports, public.transactions from authenticated;
