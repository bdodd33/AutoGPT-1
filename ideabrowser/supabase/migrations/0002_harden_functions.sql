-- Hardening pass from Supabase security advisors:
-- 1. handle_new_user() (trigger-only) was executable via the public RPC API — revoke.
-- 2. is_admin() is SECURITY DEFINER and was exposed at /rest/v1/rpc/is_admin.
--    Move it to a non-API-exposed schema (app). RLS policies evaluate with the
--    caller's privileges, so anon/authenticated keep EXECUTE — but PostgREST
--    only serves the `public` schema, so the RPC endpoint disappears.

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create schema if not exists app;
grant usage on schema app to anon, authenticated;

create function app.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function app.is_admin() to anon, authenticated;

-- Recreate every policy that referenced public.is_admin(), then drop it.
drop policy "profiles self read" on profiles;
drop policy "ideas public read" on ideas;
drop policy "ideas admin write" on ideas;
drop policy "sections read" on idea_sections;
drop policy "sections admin write" on idea_sections;
drop policy "scores read" on idea_scores;
drop policy "scores admin write" on idea_scores;
drop policy "signals read" on signals;
drop policy "signals admin write" on signals;
drop policy "subs owner read" on subscriptions;

drop function public.is_admin();

create policy "profiles self read" on profiles for select using (auth.uid() = id or app.is_admin());

create policy "ideas public read" on ideas for select using (status = 'published' or app.is_admin());
create policy "ideas admin write" on ideas for all using (app.is_admin()) with check (app.is_admin());

create policy "sections read" on idea_sections for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or app.is_admin())));
create policy "sections admin write" on idea_sections for all using (app.is_admin()) with check (app.is_admin());

create policy "scores read" on idea_scores for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or app.is_admin())));
create policy "scores admin write" on idea_scores for all using (app.is_admin()) with check (app.is_admin());

create policy "signals read" on signals for select
  using (exists (select 1 from ideas i where i.id = idea_id and (i.status = 'published' or app.is_admin())));
create policy "signals admin write" on signals for all using (app.is_admin()) with check (app.is_admin());

create policy "subs owner read" on subscriptions for select using (auth.uid() = user_id or app.is_admin());
