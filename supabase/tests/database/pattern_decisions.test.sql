-- pattern_decisions (S-05, FR-009/US-03): RLS isolation per operation, the app's partial-upsert path
-- (`insert … on conflict (user_id, merchant_key) do update set <one column>`), constraints, survival of
-- the import whose transactions formed the pattern (US-02 AC) and the account-delete cascade (FR-019).
-- Run with `npx supabase test db`. Everything happens in one transaction rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

-- Setup as postgres: users A and B, fixed UUIDs distinct from the seed user 11111111-… (rolled back with
-- the rest of the transaction, so reusing the fixed ids other test files use is safe).
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@rytm.test'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@rytm.test');

-- A owns one import with one transaction (for assertion 23 — US-02 survival), inserted directly as
-- postgres the way domain_rls.test.sql does, independent of the app's write path.
insert into public.imports (id, user_id, source, account_number, account_name, period_start, period_end)
values ('a0000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ing', '11105010000000000000000001', 'Konto A', '2026-05-01', '2026-05-31');

insert into public.transactions (user_id, import_id, account_number, occurred_on, amount_minor, bank_tx_id, counterparty, title)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a0000000-0000-4000-8000-000000000002', '11105010000000000000000001', '2026-05-04', 1299, 'TXB1', 'Sportowo', '');

-- 1. RLS is on.
select ok((select relrowsecurity from pg_class where oid = 'public.pattern_decisions'::regclass), 'RLS enabled on pattern_decisions');

-- 2. TRUNCATE bypasses RLS, so authenticated must not hold it.
select ok(not has_table_privilege('authenticated', 'public.pattern_decisions', 'TRUNCATE'), 'authenticated cannot truncate pattern_decisions');

-- As A from here.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- 3. A records a merge (the absorbed key's row) without sending user_id — the column default (auth.uid()) fills it.
select lives_ok(
  $$insert into public.pattern_decisions (merchant_key, merged_into) values ('sportowo.pl', 'sportowo')$$,
  'A records a merge without sending user_id'
);

-- 4. The stored row's user_id is A (the default, not a client-sent value).
select is(
  (select user_id from public.pattern_decisions where merchant_key = 'sportowo.pl'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'the merge decision''s user_id is A, from the default'
);

-- 5. A renames the root pattern.
select lives_ok(
  $$insert into public.pattern_decisions (merchant_key, display_name) values ('sportowo', 'Sportowo')$$,
  'A renames the root pattern'
);

-- 6. A excludes the root pattern through the app's partial-upsert path (one column, on conflict).
select lives_ok(
  $$insert into public.pattern_decisions (merchant_key, excluded) values ('sportowo', true)
    on conflict (user_id, merchant_key) do update set excluded = excluded.excluded$$,
  'A excludes the root pattern through the app''s partial upsert (on conflict do update, one column)'
);

-- 7. The partial upsert kept display_name: sportowo is now both excluded and still named "Sportowo".
select ok(
  (select excluded from public.pattern_decisions where merchant_key = 'sportowo') = true
    and (select display_name from public.pattern_decisions where merchant_key = 'sportowo') = 'Sportowo',
  'the partial upsert set excluded without resetting display_name'
);

-- 8. A pins the type on the same row with a plain update (the app's upsert relies on the same UPDATE policy).
with u as (update public.pattern_decisions set pinned_type = 'fixed' where merchant_key = 'sportowo' returning 1)
select is(count(*), 1::bigint, 'A pins the type on its own row') from u;

-- 9. A second row for the same (user_id, merchant_key) is rejected by the unique constraint.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key) values ('sportowo')$$,
  '23505', null, 'a second row for the same merchant_key is rejected (unique user_id, merchant_key)'
);

-- 10. Self-merge is rejected by the named check constraint.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key, merged_into) values ('self-merge', 'self-merge')$$,
  '23514', null, 'a self-merge (merchant_key = merged_into) is rejected'
);

-- 11. An unknown pinned_type is rejected.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key, pinned_type) values ('invalid-type', 'weekly')$$,
  '23514', null, 'an unknown pinned_type is rejected'
);

-- 12. An empty display_name is rejected.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key, display_name) values ('invalid-name', '')$$,
  '23514', null, 'an empty display_name is rejected'
);

-- 13. A display_name of 101 characters is rejected.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key, display_name) values ('invalid-name-2', repeat('a', 101))$$,
  '23514', null, 'a display_name of 101 characters is rejected'
);

-- 14. An empty merchant_key is rejected.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key) values ('')$$,
  '23514', null, 'an empty merchant_key is rejected'
);

-- 15. An empty merged_into is rejected.
select throws_ok(
  $$insert into public.pattern_decisions (merchant_key, merged_into) values ('invalid-merge', '')$$,
  '23514', null, 'an empty merged_into is rejected'
);

-- As B from here.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);

-- 16. B sees none of A's decisions.
select is(
  (select count(*) from public.pattern_decisions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'B sees no decisions of A'
);

-- 17. B's update of "sportowo" touches 0 rows (RLS scopes the update to B's own rows, and B has none yet).
with u as (update public.pattern_decisions set excluded = false where merchant_key = 'sportowo' returning 1)
select is(count(*), 0::bigint, 'B updates 0 rows attempting merchant_key sportowo (none are B''s)') from u;

-- 18. Likewise for delete.
with d as (delete from public.pattern_decisions where merchant_key = 'sportowo' returning 1)
select is(count(*), 0::bigint, 'B deletes 0 rows attempting merchant_key sportowo (none are B''s)') from d;

-- 19. B cannot insert a row claiming A's user_id.
select throws_ok(
  $$insert into public.pattern_decisions (user_id, merchant_key) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sportowo-b')$$,
  '42501', null, 'B cannot insert a decision with user_id of A'
);

-- 20. B sets its own "sportowo" row — keys are per user, so this does not collide with A's.
select lives_ok(
  $$insert into public.pattern_decisions (merchant_key, excluded) values ('sportowo', true)$$,
  'B sets its own sportowo decision (per-user key, no collision with A''s)'
);

-- 21. B cannot move its own row onto A's user_id (the UPDATE policy's WITH CHECK, not just USING).
select throws_ok(
  $$update public.pattern_decisions set user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' where merchant_key = 'sportowo'$$,
  '42501', null, 'B cannot move its own decision onto A''s user_id (update with check)'
);

-- Back to A.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);

-- 22. A's sportowo row is unchanged by B's attempts: still excluded, pinned fixed, named "Sportowo".
select ok(
  (select excluded from public.pattern_decisions where merchant_key = 'sportowo') = true
    and (select pinned_type from public.pattern_decisions where merchant_key = 'sportowo') = 'fixed'
    and (select display_name from public.pattern_decisions where merchant_key = 'sportowo') = 'Sportowo',
  'A''s sportowo decision is unchanged by B''s attempts'
);

-- Deleting A's import (and its transaction, by cascade) must not touch A's decisions (US-02 AC: a
-- decision is keyed on the merchant, not on any import).
delete from public.imports where id = 'a0000000-0000-4000-8000-000000000002'::uuid;

-- 23. Both of A's decision rows (the merge and the root) survive the import delete.
select is(
  (select count(*) from public.pattern_decisions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2::bigint,
  'A''s decisions survive deletion of the import whose transaction formed the pattern'
);

-- A deletes their own account; delete_own_account() removes only the auth.users row and relies on the
-- account_id FK cascade (on delete cascade) to remove everything else, including pattern_decisions.
select public.delete_own_account();

reset role;

-- 24. As postgres: no decisions of A remain after the account delete (cascade).
select is(
  (select count(*) from public.pattern_decisions where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'account deletion cascades and removes A''s decisions'
);

-- 25. B's decision is untouched by A's account deletion.
select is(
  (select count(*) from public.pattern_decisions where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and merchant_key = 'sportowo'),
  1::bigint,
  'B''s decision survives A''s account deletion'
);

-- 26. anon has no access at all.
set local role anon;

select throws_ok('insert into public.pattern_decisions (merchant_key) values (''x'')', '42501', null, 'anon cannot insert into pattern_decisions');

reset role;

select * from finish();

rollback;
