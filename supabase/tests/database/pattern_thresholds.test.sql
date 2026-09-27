-- pattern_thresholds (S-04, FR-010/FR-011): RLS isolation per operation, the app's upsert path
-- (`insert … on conflict (user_id, merchant_key) do update`), constraints, survival of the import whose
-- transactions formed the pattern (US-02 AC) and the account-delete cascade (FR-019). Run with
-- `npx supabase test db`. Everything happens in one transaction rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Setup as postgres: users A and B, fixed UUIDs distinct from the seed user 11111111-… (rolled back with
-- the rest of the transaction, so reusing the fixed ids other test files use is safe).
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

-- A owns one import with one transaction (for assertion 19 — US-02 survival), inserted directly as
-- postgres the way domain_rls.test.sql does, independent of the app's write path.
insert into public.imports (id, user_id, source, account_number, account_name, period_start, period_end)
values ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ing', '11105010000000000000000001', 'Konto A', '2026-05-01', '2026-05-31');

insert into public.transactions (user_id, import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty, title)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000001', '11105010000000000000000001', '2026-05-04', 1299, 'TXA1', 'Wolt', '');

-- 1. RLS is on.
select ok((select relrowsecurity from pg_class where oid = 'public.pattern_thresholds'::regclass), 'RLS enabled on pattern_thresholds');

-- 2. TRUNCATE bypasses RLS, so authenticated must not hold it.
select ok(not has_table_privilege('authenticated', 'public.pattern_thresholds', 'TRUNCATE'), 'authenticated cannot truncate pattern_thresholds');

-- As A from here.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- 3. A sets a threshold without sending user_id — the column default (auth.uid()) fills it.
select lives_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('wolt', 'count', 4)$$,
  'A sets a threshold without sending user_id'
);

-- 4. The stored row's user_id is A (the default, not a client-sent value).
select is(
  (select user_id from public.pattern_thresholds where merchant_key = 'wolt'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'the threshold''s user_id is A, from the default'
);

-- 5. A changes the threshold the way the app does: upsert on the (user_id, merchant_key) conflict.
select lives_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('wolt', 'sum', 50000)
    on conflict (user_id, merchant_key) do update set kind = excluded.kind, value = excluded.value$$,
  'A changes the threshold through the app''s upsert (on conflict do update)'
);

-- 6. Exactly one wolt row for A, updated in place (not duplicated) to sum / 50000.
select ok(
  (select count(*) from public.pattern_thresholds where merchant_key = 'wolt') = 1
    and (select kind from public.pattern_thresholds where merchant_key = 'wolt') = 'sum'
    and (select value from public.pattern_thresholds where merchant_key = 'wolt') = 50000,
  'the upsert updated the one wolt row in place, not a duplicate'
);

-- 7. A plain update also works (the app's upsert relies on the same UPDATE policy).
with u as (update public.pattern_thresholds set value = 3 where merchant_key = 'wolt' returning 1)
select is(count(*), 1::bigint, 'A updates its own threshold') from u;

-- 8. A second row for the same (user_id, merchant_key) is rejected by the unique constraint.
select throws_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('wolt', 'count', 4)$$,
  '23505', null, 'a second row for the same merchant_key is rejected (unique user_id, merchant_key)'
);

-- 9. Unknown kind is rejected by the check constraint.
select throws_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('invalid-kind', 'weekly', 4)$$,
  '23514', null, 'an unknown kind is rejected'
);

-- 10. Zero value is rejected by the check constraint.
select throws_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('invalid-value', 'count', 0)$$,
  '23514', null, 'a zero value is rejected'
);

-- 11. Empty merchant_key is rejected by the check constraint.
select throws_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('', 'count', 4)$$,
  '23514', null, 'an empty merchant_key is rejected'
);

-- As B from here.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

-- 12. B sees none of A's thresholds.
select is(
  (select count(*) from public.pattern_thresholds where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'B sees no thresholds of A'
);

-- 13. B's update of "wolt" touches 0 rows (RLS scopes the update to B's own rows, and B has none yet).
with u as (update public.pattern_thresholds set value = 999 where merchant_key = 'wolt' returning 1)
select is(count(*), 0::bigint, 'B updates 0 rows attempting merchant_key wolt (none are B''s)') from u;

-- 14. Likewise for delete.
with d as (delete from public.pattern_thresholds where merchant_key = 'wolt' returning 1)
select is(count(*), 0::bigint, 'B deletes 0 rows attempting merchant_key wolt (none are B''s)') from d;

-- 15. B cannot insert a row claiming A's user_id.
select throws_ok(
  $$insert into public.pattern_thresholds (user_id, merchant_key, kind, value)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'wolt-b', 'count', 4)$$,
  '42501', null, 'B cannot insert a threshold with user_id of A'
);

-- 16. B sets its own "wolt" threshold — keys are per user, so this does not collide with A's.
select lives_ok(
  $$insert into public.pattern_thresholds (merchant_key, kind, value) values ('wolt', 'count', 4)$$,
  'B sets its own wolt threshold (per-user key, no collision with A''s)'
);

-- 17. B cannot move its own row onto A's user_id (the UPDATE policy's WITH CHECK, not just USING).
select throws_ok(
  $$update public.pattern_thresholds set user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' where merchant_key = 'wolt'$$,
  '42501', null, 'B cannot move its own threshold onto A''s user_id (update with check)'
);

-- Back to A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- 18. A's threshold value is still 3 — none of B's attempts above changed it.
select is(
  (select value from public.pattern_thresholds where merchant_key = 'wolt'),
  3::bigint,
  'A''s threshold is unchanged by B''s attempts'
);

-- Deleting A's import (and its transaction, by cascade) must not touch A's threshold (US-02 AC: the
-- threshold is keyed on the merchant, not on any import).
delete from public.imports where id = 'a0000000-0000-4000-8000-000000000001'::uuid;

-- 19. A's threshold survives the import delete.
select is(
  (select count(*) from public.pattern_thresholds where merchant_key = 'wolt'),
  1::bigint,
  'A''s threshold survives deletion of the import whose transaction formed the pattern'
);

-- A deletes their own account; delete_own_account() removes only the auth.users row and relies on the
-- account_id FK cascade (on delete cascade) to remove everything else, including pattern_thresholds.
select public.delete_own_account();

reset role;

-- 20. As postgres: no thresholds of A remain after the account delete (cascade).
select is(
  (select count(*) from public.pattern_thresholds where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion cascades and removes A''s threshold'
);

-- 21. B's threshold is untouched by A's account deletion.
select is(
  (select count(*) from public.pattern_thresholds where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and merchant_key = 'wolt'),
  1::bigint,
  'B''s threshold survives A''s account deletion'
);

-- 22. anon has no access at all.
set local role anon;

select throws_ok('insert into public.pattern_thresholds (merchant_key, kind, value) values (''x'', ''count'', 1)', '42501', null, 'anon cannot insert into pattern_thresholds');

reset role;

select * from finish();

rollback;
