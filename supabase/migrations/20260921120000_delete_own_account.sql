-- Self-service account deletion (FR-019).
-- Lets a signed-in user delete their own row in auth.users without the service_role key.
-- Supabase's own cascades (auth.identities, auth.sessions, auth.refresh_tokens) and future
-- domain tables with `on delete cascade` foreign keys (F-01) remove the rest.
--
-- No new tables here, so the "always enable RLS on new tables" rule from CLAUDE.md does not apply.
-- Access is restricted instead by revoking execute from public/anon and granting it to authenticated;
-- the function itself refuses to run without an authenticated auth.uid().

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'delete_own_account requires an authenticated user';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

comment on function public.delete_own_account() is
  'FR-019: deletes the calling user''s own auth.users row (self-service account deletion). Callable only by the authenticated role.';

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
