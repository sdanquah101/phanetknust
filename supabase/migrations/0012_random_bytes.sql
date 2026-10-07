-- On Supabase, pgcrypto is installed in the "extensions" schema. Functions pinned to search_path = public
-- (certificate, welfare and prayer-wall codes) could not see gen_random_bytes and failed at runtime.
-- This adds public.gen_random_bytes, which forwards to the extensions copy. Safe to run more than once.
do $$
begin
  if to_regprocedure('public.gen_random_bytes(integer)') is null
     and to_regprocedure('extensions.gen_random_bytes(integer)') is not null then
    execute 'create function public.gen_random_bytes(integer) returns bytea language sql volatile strict
             as ''select extensions.gen_random_bytes($1)''';
  end if;
end $$;

notify pgrst, 'reload schema';
