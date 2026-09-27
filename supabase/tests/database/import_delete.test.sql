-- Deletion of one's own import (S-02, FR-004/FR-005): the "imports: authenticated delete own" RLS policy and
-- the transactions_import_account_fkey cascade, isolation from other imports/users, and that the range and
-- bank_tx_ids freed by the delete are re-importable. Run with `npx supabase test db`.
-- Everything happens in one transaction rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

-- Setup as postgres: users A and B, fixed UUIDs distinct from the seed user 11111111-…
-- (this file's inserts are rolled back with the rest of the transaction, so reusing the same fixed
-- ids other test files use is safe — nothing here persists past this file's run).
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

-- A owns two imports: A1 (account X, two transactions — the one that gets deleted) and A2 (account Y, one
-- transaction — must survive the A1 delete untouched). Created through the app's own write path
-- (public.import_ing_statement), same as the endpoint would use.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select public.import_ing_statement(
  '11105010000000000000000101', 'Konto A1', '2026-05-01', '2026-05-31',
  '[{"occurred_on":"2026-05-04","amount_minor":1299,"bank_tx_id":"000000000000000101","counterparty":"Sklep A1","title":"","details":null},
    {"occurred_on":"2026-05-20","amount_minor":4550,"bank_tx_id":"000000000000000102","counterparty":"Kawiarnia A1","title":"","details":null}]'::jsonb
) as a1_id \gset

select public.import_ing_statement(
  '11105010000000000000000102', 'Konto A2', '2026-06-01', '2026-06-30',
  '[{"occurred_on":"2026-06-10","amount_minor":700,"bank_tx_id":"000000000000000103","counterparty":"Sklep A2","title":"","details":null}]'::jsonb
) as a2_id \gset

-- B owns one import (B1) — must be untouched by anything A or a stranger does below.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select public.import_ing_statement(
  '11105010000000000000000103', 'Konto B1', '2026-07-01', '2026-07-31',
  '[{"occurred_on":"2026-07-10","amount_minor":300,"bank_tx_id":"000000000000000104","counterparty":"Sklep B1","title":"","details":null}]'::jsonb
) as b1_id \gset

-- Back to A: delete A1 exactly the way the endpoint does (delete … returning id).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- 1. A deletes its own import A1 — the returning select the endpoint relies on sees exactly one row.
with d as (delete from public.imports where id = :'a1_id'::uuid returning 1)
select is(count(*), 1::bigint, 'A deletes its own import (A1)') from d;

-- 2. The cascade (transactions_import_account_fkey) removed A1's transactions too.
select is(
  (select count(*) from public.transactions where import_id = :'a1_id'::uuid),
  0::bigint,
  'A1''s transactions are gone after the cascade'
);

-- 3. A2 (a different import of the same owner) and its transaction are untouched.
select ok(
  (select count(*) from public.imports where id = :'a2_id'::uuid) = 1
    and (select count(*) from public.transactions where import_id = :'a2_id'::uuid) = 1,
  'A2 and its transaction are unchanged by the A1 delete'
);

-- 4. The range and bank_tx_ids freed by the delete are re-importable (would throw 23P01 / 23505 while A1 lived).
select lives_ok(
  $$select public.import_ing_statement(
      '11105010000000000000000101', 'Konto A1', '2026-05-01', '2026-05-31',
      '[{"occurred_on":"2026-05-04","amount_minor":1299,"bank_tx_id":"000000000000000101","counterparty":"Sklep A1","title":"","details":null},
        {"occurred_on":"2026-05-20","amount_minor":4550,"bank_tx_id":"000000000000000102","counterparty":"Kawiarnia A1","title":"","details":null}]'::jsonb)$$,
  'the same range and bank_tx_ids are accepted again after the delete'
);

-- 5. The re-import holds the same number of transactions as the original A1.
select is(
  (select count(*) from public.transactions where account_number = '11105010000000000000000101'),
  2::bigint,
  'the re-import holds the same number of transactions'
);

-- 6. A stranger (B) attempting to delete A2 by its real id is filtered out by RLS — 0 rows, no error.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

with d as (delete from public.imports where id = :'a2_id'::uuid returning 1)
select is(count(*), 0::bigint, 'B deletes no rows attempting the id of A2 (foreign id)') from d;

-- 7. As A, A2 still exists after B's attempt.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is(
  (select count(*) from public.imports where id = :'a2_id'::uuid),
  1::bigint,
  'A2 still exists after the foreign delete attempt'
);

-- 8. A random, non-existent uuid deletes nothing and raises no error (the endpoint's "missing" branch relies
-- on this: an RLS-filtered delete of an id that never existed looks identical to one that belongs to someone else).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

with d as (delete from public.imports where id = '00000000-0000-4000-8000-000000000000'::uuid returning 1)
select is(count(*), 0::bigint, 'deleting a non-existent id deletes nothing and raises no error') from d;

-- 9. B1 and its transaction survive every attempt above, as B.
select ok(
  (select count(*) from public.imports where id = :'b1_id'::uuid) = 1
    and (select count(*) from public.transactions where import_id = :'b1_id'::uuid) = 1,
  'B1 and its transaction survive every attempt above'
);

-- 10. anon cannot delete from imports at all (revoke all … from anon).
reset role;
set local role anon;

select throws_ok('delete from public.imports', '42501', null, 'anon cannot delete from imports');

reset role;

select * from finish();

rollback;
