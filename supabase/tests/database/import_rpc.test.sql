-- Atomic ING import RPC public.import_ing_statement() (S-01): success, FR-005 overlap per bank account,
-- input validation (22023), all-or-nothing on a failure after the import row is written, grants (anon)
-- and account isolation (FR-002). Run with `npx supabase test db`.
-- Everything happens in one transaction rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- Setup as postgres: accounts A and B, no domain rows yet (everything below goes through the RPC).
-- Fixed UUIDs, distinct from the seed user 11111111-….
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- Success: returns the import id and stores one transaction per array element.
select isnt(
  public.import_ing_statement(
    '11105010000000000000000001', 'Konto A', '2026-01-01', '2026-01-31',
    '[{"occurred_on":"2026-01-01","amount_minor":11685,"bank_tx_id":"000000000000000001","counterparty":"Sklep A","title":"Zakupy","details":null},
      {"occurred_on":"2026-01-15","amount_minor":5000,"bank_tx_id":"000000000000000002","counterparty":"Sklep B","title":"Zakupy","details":"Karta"},
      {"occurred_on":"2026-01-31","amount_minor":250,"bank_tx_id":null,"counterparty":"Sklep C","title":"","details":null}]'::jsonb
  ),
  null,
  'a valid statement returns the import id'
);

select is(
  (select count(*) from public.transactions t
     join public.imports i on i.id = t.import_id
    where i.account_number = '11105010000000000000000001'),
  3::bigint,
  'the import holds one transaction per array element'
);

-- FR-005 per bank account: an overlapping range of the same account is rejected and writes nothing.
select throws_ok(
  $$select public.import_ing_statement(
      '11105010000000000000000001', 'Konto A', '2026-01-31', '2026-02-28',
      '[{"occurred_on":"2026-02-10","amount_minor":100,"bank_tx_id":"000000000000000003","counterparty":"Sklep D","title":"","details":null}]'::jsonb)$$,
  '23P01', null, 'an import overlapping the same account by one day is rejected'
);

select is((select count(*) from public.imports), 1::bigint, 'the rejected overlap leaves no import row');
select is((select count(*) from public.transactions), 3::bigint, 'the rejected overlap leaves no transaction rows');

select lives_ok(
  $$select public.import_ing_statement(
      '44105010000000000000000004', 'Konto A2', '2026-01-01', '2026-01-31',
      '[{"occurred_on":"2026-01-10","amount_minor":700,"bank_tx_id":"000000000000000004","counterparty":"Sklep E","title":"","details":null}]'::jsonb)$$,
  'an import of another account over the same range is accepted'
);

-- Validation (22023) happens before any insert.
select throws_ok(
  $$select public.import_ing_statement(
      '55105010000000000000000005', 'Konto A3', '2026-03-01', '2026-03-31',
      '[{"occurred_on":"2026-03-10","amount_minor":100,"bank_tx_id":null,"counterparty":"W zakresie","title":"","details":null},
        {"occurred_on":"2026-04-01","amount_minor":100,"bank_tx_id":null,"counterparty":"Poza zakresem","title":"","details":null}]'::jsonb)$$,
  '22023', null, 'a transaction dated outside the import range is rejected'
);

select is(
  (select count(*) from public.imports where account_number = '55105010000000000000000005'),
  0::bigint,
  'the out-of-range rejection leaves no import row'
);

select throws_ok(
  $$select public.import_ing_statement(
      '55105010000000000000000005', 'Konto A3', '2026-03-01', '2026-03-31', '[]'::jsonb)$$,
  '22023', null, 'an empty transaction array is rejected'
);

select throws_ok(
  $$select public.import_ing_statement(
      '55105010000000000000000005', 'Konto A3', '2026-03-01', '2026-03-31',
      (select jsonb_agg(jsonb_build_object(
          'occurred_on', '2026-03-10', 'amount_minor', 100, 'bank_tx_id', null,
          'counterparty', 'X', 'title', '', 'details', null))
         from generate_series(1, 5001)))$$,
  '22023', null, 'more than 5000 transactions are rejected'
);

-- Atomicity after the import row is written: a failing transaction insert rolls the import back too.
select throws_ok(
  $$select public.import_ing_statement(
      '55105010000000000000000005', 'Konto A3', '2026-03-01', '2026-03-31',
      '[{"occurred_on":"2026-03-10","amount_minor":100,"bank_tx_id":"000000000000000009","counterparty":"Raz","title":"","details":null},
        {"occurred_on":"2026-03-11","amount_minor":100,"bank_tx_id":"000000000000000009","counterparty":"Dwa","title":"","details":null}]'::jsonb)$$,
  '23505', null, 'a duplicate bank transaction id inside the statement is rejected'
);

select is(
  (select count(*) from public.imports where account_number = '55105010000000000000000005'),
  0::bigint,
  'the failed transaction insert leaves no import row behind'
);

-- An authenticated role without a user id in the JWT is rejected before any insert.
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);

select throws_ok(
  $$select public.import_ing_statement(
      '77105010000000000000000007', 'Bez uzytkownika', '2026-01-01', '2026-01-31',
      '[{"occurred_on":"2026-01-10","amount_minor":100,"bank_tx_id":null,"counterparty":"X","title":"","details":null}]'::jsonb)$$,
  '22023', null, 'a call without auth.uid() is rejected'
);

-- FR-002: account B sees nothing that A imported.
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select is((select count(*) from public.imports), 0::bigint, 'B sees no imports of A');
select is((select count(*) from public.transactions), 0::bigint, 'B sees no transactions of A');

-- anon cannot execute the RPC at all.
reset role;
set local role anon;

select throws_ok(
  $$select public.import_ing_statement(
      '66105010000000000000000006', 'Anon', '2026-01-01', '2026-01-31',
      '[{"occurred_on":"2026-01-10","amount_minor":100,"bank_tx_id":null,"counterparty":"X","title":"","details":null}]'::jsonb)$$,
  '42501', null, 'anon cannot execute import_ing_statement'
);

reset role;

select * from finish();

rollback;
