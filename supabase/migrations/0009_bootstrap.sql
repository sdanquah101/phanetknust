-- First admin: run once after creating your own account in Supabase Auth.
-- Replace the email below, then execute in the SQL editor.
create or replace function public.grant_role_by_email(p_email text, p_role public.app_role) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then raise exception 'No auth user with email %', p_email; end if;
  insert into public.user_roles (user_id, role) values (uid, p_role) on conflict do nothing;
end $$;
revoke execute on function public.grant_role_by_email(text, public.app_role) from public, anon, authenticated;
-- select public.grant_role_by_email('danquah.stefan@gmail.com', 'admin');
-- select public.grant_role_by_email('danquah.stefan@gmail.com', 'pastor');
