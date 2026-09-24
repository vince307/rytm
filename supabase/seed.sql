-- Local/CI seed. Runs on every `supabase start` and `supabase db reset` (config.toml [db.seed]).
-- Never applied to production: `supabase db push` only ships migrations.
--
-- Test account for the first local run and for the smoke test (scripts/smoke.mjs):
--   test@rytm.local / Rytm-Test-Passw0rd!
-- The fixed UUID lets future domain seeds (imports, patterns) reference this user.
-- Domain data is not seeded: the synthetic ING statements live in test/fixtures/ing/ (scripts/fixture-ing.mjs);
-- rows reach the database only through a real import (S-01) and the demo account (S-09).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'test@rytm.local',
  extensions.crypt('Rytm-Test-Passw0rd!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  -- GoTrue reads these as strings, not NULLs — empty strings avoid "converting NULL to string" on sign-in.
  '', '', '', '',
  now(), now()
)
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  'email',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"test@rytm.local","email_verified":true}'::jsonb,
  now(), now(), now()
)
on conflict (provider_id, provider) do nothing;
