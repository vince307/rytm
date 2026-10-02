-- Atomic import RPC public.import_statement() (S-10): source-aware write path, null bank_tx_id for banks
-- without an id, FR-005 overlap per bank account (disjoint ranges accepted, overlap rejected), period
-- validation (22023), the widened source check (23514), grants (anon) and account isolation (FR-002).
-- public.import_ing_statement() stays the ING regression (import_rpc.test.sql, byte-identical).
-- Run with `npx supabase test db`. Everything happens in one transaction rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

-- Setup as postgres: accounts A and B, no domain rows yet (everything below goes through the RPC).
-- Fixed UUIDs, distinct from the seed user 11111111-….
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- Success: a Santander import returns the id, records source = 'santander', and stores all-null bank_tx_id.
select isnt(
  public.import_statement(
    'santander', '11105010000000000000000001', 'Rachunek', '2026-01-01', '2026-01-31',
    '[{"occurred_on":"2026-01-01","amount_minor":11685,"bank_tx_id":null,"counterparty":"Sklep A","title":"Zakupy","details":""},
      {"occurred_on":"2026-01-15","amount_minor":5000,"bank_tx_id":null,"counterparty":"Sklep B","title":"Zakupy","details":""}]'::jsonb
  ),
  null,
  'a valid santander statement returns the import id'
);

select is(
  (select source from public.imports where account_number = '11105010000000000000000001'),
  'santander',
  'the import records source santander'
);

select is(
  (select count(*) from public.transactions t
     join public.imports i on i.id = t.import_id
    where i.account_number = '11105010000000000000000001' and t.bank_tx_id is null),
  2::bigint,
  'both transactions store a null bank_tx_id'
);

-- Two Santander imports of one account in disjoint ranges are both accepted (no 23505 from null ids).
select lives_ok(
  $$select public.import_statement(
      'santander', '11105010000000000000000001', 'Rachunek', '2026-02-01', '2026-02-28',
      '[{"occurred_on":"2026-02-10","amount_minor":300,"bank_tx_id":null,"counterparty":"Sklep C","title":"","details":""}]'::jsonb)$$,
  'a second santander import of the same account in a disjoint range is accepted'
);

-- An overlapping range is rejected, with no rows added.
select throws_ok(
  $$select public.import_statement(
      'santander', '11105010000000000000000001', 'Rachunek', '2026-02-20', '2026-03-10',
      '[{"occurred_on":"2026-02-25","amount_minor":100,"bank_tx_id":null,"counterparty":"Sklep D","title":"","details":""}]'::jsonb)$$,
  '23P01', null, 'an import overlapping the same account range is rejected'
);

select is(
  (select count(*) from public.imports where account_number = '11105010000000000000000001'),
  2::bigint,
  'the rejected overlap adds no import row'
);

-- An out-of-period occurred_on is rejected (22023), with no imports row.
select throws_ok(
  $$select public.import_statement(
      'santander', '22105010000000000000000002', 'Rachunek', '2026-03-01', '2026-03-31',
      '[{"occurred_on":"2026-04-01","amount_minor":100,"bank_tx_id":null,"counterparty":"Poza zakresem","title":"","details":""}]'::jsonb)$$,
  '22023', null, 'an occurred_on outside the period is rejected'
);

select is(
  (select count(*) from public.imports where account_number = '22105010000000000000000002'),
  0::bigint,
  'the out-of-period rejection leaves no import row'
);

-- import_statement('ing', …) still records 'ing'. The write and the assertion are two statements
-- (not a WHERE id = <volatile call> subquery): a volatile function used that way gets re-evaluated once
-- per row the scan visits, which would call the RPC again and collide with its own just-inserted range.
select public.import_statement(
  'ing', '33105010000000000000000003', 'Konto ING', '2026-01-01', '2026-01-31',
  '[{"occurred_on":"2026-01-10","amount_minor":100,"bank_tx_id":"000000000000000099","counterparty":"Sklep E","title":"","details":null}]'::jsonb
);

select is(
  (select source from public.imports where account_number = '33105010000000000000000003'),
  'ing',
  'import_statement(''ing'', …) records source ing'
);

-- An unknown source is rejected by the widened check (23514).
select throws_ok(
  $$select public.import_statement(
      'mbank', '44105010000000000000000004', 'Konto', '2026-01-01', '2026-01-31',
      '[{"occurred_on":"2026-01-10","amount_minor":100,"bank_tx_id":null,"counterparty":"X","title":"","details":""}]'::jsonb)$$,
  '23514', null, 'an unknown source is rejected'
);

-- An element carrying another user's user_id key still lands under the caller (A), never user B.
select isnt(
  public.import_statement(
    'santander', '55105010000000000000000005', 'Rachunek', '2026-04-01', '2026-04-30',
    ('[{"occurred_on":"2026-04-10","amount_minor":100,"bank_tx_id":null,"counterparty":"X","title":"","details":"","user_id":"' ||
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' || '"}]')::jsonb
  ),
  null,
  'a payload element carrying a user_id key is still accepted'
);

select is(
  (select user_id from public.transactions where account_number = '55105010000000000000000005'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'the transaction lands under the caller, not the user_id key in the payload'
);

-- anon cannot execute the RPC at all, and has no EXECUTE privilege (explicit revoke matters: Supabase's
-- default privileges would otherwise grant a new function EXECUTE to PUBLIC, which includes anon).
select ok(
  not has_function_privilege('anon', 'public.import_statement(text, text, text, date, date, jsonb)', 'EXECUTE'),
  'anon has no EXECUTE privilege on import_statement'
);

reset role;
set local role anon;

select throws_ok(
  $$select public.import_statement(
      'santander', '66105010000000000000000006', 'Rachunek', '2026-01-01', '2026-01-31',
      '[{"occurred_on":"2026-01-10","amount_minor":100,"bank_tx_id":null,"counterparty":"X","title":"","details":""}]'::jsonb)$$,
  '42501', null, 'anon cannot execute import_statement'
);

reset role;

-- FR-002: account B sees nothing account A imported through import_statement.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

select is((select count(*) from public.imports), 0::bigint, 'B sees no imports A wrote through import_statement');

reset role;

select * from finish();

rollback;
