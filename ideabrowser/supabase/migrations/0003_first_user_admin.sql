-- Bootstrap: the first account ever created becomes the admin. Fine for a
-- personal instance where you are the first signup; revisit before any public
-- deploy where signup is open prior to you registering.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when not exists (select 1 from public.profiles) then 'admin'::user_role
         else 'user'::user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
