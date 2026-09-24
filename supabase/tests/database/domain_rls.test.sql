-- Domain tables at the database level: account isolation (FR-002), overlapping imports (FR-005),
-- account deletion cascade (FR-019) and column constraints. Run with `npx supabase test db`.
-- Everything happens in one transaction rolled back at the end; later slices extend this file
-- (or add a sibling) for their own tables.

begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

-- Setup as postgres: account A with one import + transaction, account B with the same (for FR-019).
-- Fixed UUIDs, distinct from the seed user 11111111-….
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

insert into public.imports (id, user_id, source, account_number, account_name, period_start, period_end)
values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ing', '11105010000000000000000001', 'Konto A', '2026-01-01', '2026-01-31'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'ing', '22105010000000000000000002', 'Konto B', '2026-01-01', '2026-01-31');

insert into public.transactions (user_id, import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty, title)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-10', 11685, 'TXA1', 'Sklep A', 'Zakupy'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b0000000-0000-4000-8000-000000000001', '22105010000000000000000002', '2026-01-10', 5000, 'TXB1', 'Sklep B', 'Zakupy');

-- RLS is on for both tables.
select ok((select relrowsecurity from pg_class where oid = 'public.imports'::regclass), 'RLS enabled on imports');
select ok((select relrowsecurity from pg_class where oid = 'public.transactions'::regclass), 'RLS enabled on transactions');

-- TRUNCATE bypasses RLS, so authenticated must not hold it.
select ok(not has_table_privilege('authenticated', 'public.imports', 'TRUNCATE'), 'authenticated cannot truncate imports');
select ok(not has_table_privilege('authenticated', 'public.transactions', 'TRUNCATE'), 'authenticated cannot truncate transactions');

-- FR-002: account B cannot see, insert for, or delete account A's rows.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select is((select count(*) from public.imports where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'B sees no imports of A');
select is((select count(*) from public.transactions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'B sees no transactions of A');

select throws_ok(
  $$insert into public.imports (user_id, source, account_number, account_name, period_start, period_end)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ing', '33105010000000000000000003', 'Obce', '2026-03-01', '2026-03-31')$$,
  '42501', null, 'B cannot insert an import with user_id of A'
);

select throws_ok(
  $$insert into public.transactions (user_id, import_id, account_number, occurred_on, amount_minor, counterparty)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-11', 100, 'X')$$,
  '23503', null, 'B cannot attach a transaction to an import of A (composite FK)'
);

-- Two users may hold the same bank account (joint account): the overlap and dedupe keys are per user.
select lives_ok(
  $$insert into public.imports (id, source, account_number, account_name, period_start, period_end)
    values ('b0000000-0000-4000-8000-000000000002', 'ing', '11105010000000000000000001', 'Wspólne', '2026-01-01', '2026-01-31')$$,
  'B may import the account number A imported, over the same range'
);

select lives_ok(
  $$insert into public.transactions (import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty)
    values ('b0000000-0000-4000-8000-000000000002', '11105010000000000000000001', '2026-01-10', 11685, 'TXA1', 'Sklep A')$$,
  'B may store the bank transaction id A stored for that account number'
);

with d as (delete from public.transactions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1)
select is(count(*), 0::bigint, 'B deletes no transactions of A') from d;

with d as (delete from public.imports where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1)
select is(count(*), 0::bigint, 'B deletes no imports of A') from d;

-- FR-002: account A sees its own rows; update is not allowed (no update policy).
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is((select count(*) from public.imports), 1::bigint, 'A sees exactly its own import');
select is((select count(*) from public.transactions), 1::bigint, 'A sees exactly its own transaction');

select throws_ok(
  $$update public.imports set account_name = 'Zmienione'$$,
  '42501', null, 'A cannot update its imports'
);

select throws_ok(
  $$update public.transactions set title = 'Zmienione'$$,
  '42501', null, 'A cannot update its transactions'
);

-- FR-005: overlapping range of the same account is rejected, another account in the same range is accepted.
select throws_ok(
  $$insert into public.imports (source, account_number, account_name, period_start, period_end)
    values ('ing', '11105010000000000000000001', 'Konto A', '2026-01-31', '2026-02-28')$$,
  '23P01', null, 'import touching an existing range of the same account by one day is rejected'
);

select lives_ok(
  $$insert into public.imports (source, account_number, account_name, period_start, period_end)
    values ('ing', '44105010000000000000000004', 'Konto A2', '2026-01-01', '2026-01-31')$$,
  'import of another account in the same range is accepted'
);

-- Transaction key: bank_tx_id unique per account, null allowed many times; amounts are positive.
select throws_ok(
  $$insert into public.transactions (import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty)
    values ('a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-12', 200, 'TXA1', 'Sklep A')$$,
  '23505', null, 'duplicate (account_number, bank_tx_id) is rejected'
);

select throws_ok(
  $$insert into public.transactions (import_id, account_number, occurred_on, amount_minor, counterparty)
    values ('a0000000-0000-4000-8000-000000000001', '99105010000000000000000009', '2026-01-12', 200, 'Inny rachunek')$$,
  '23503', null, 'a transaction must carry the account number of its import'
);

select lives_ok(
  $$insert into public.transactions (import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty)
    values ('a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-12', 200, null, 'Bez ID 1'),
           ('a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-12', 200, null, 'Bez ID 2')$$,
  'many transactions without bank_tx_id are accepted'
);

select throws_ok(
  $$insert into public.transactions (import_id, account_number, occurred_on, amount_minor, counterparty)
    values ('a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-01-13', 0, 'Zero')$$,
  '23514', null, 'non-positive amount_minor is rejected'
);

-- anon has no access at all.
reset role;
set local role anon;

select throws_ok('select * from public.imports', '42501', null, 'anon cannot read imports');
select throws_ok('select * from public.transactions', '42501', null, 'anon cannot read transactions');

-- FR-019: deleting account A removes all its imports and transactions, and nothing of B.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);
select public.delete_own_account();
reset role;

select is((select count(*) from public.imports where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'account deletion removes all imports of A');
select is((select count(*) from public.transactions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'account deletion removes all transactions of A');
select is((select count(*) from public.imports where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 2::bigint, 'imports of B survive deletion of A');
select is((select count(*) from public.transactions where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 2::bigint, 'transactions of B survive deletion of A');

select * from finish();

rollback;
