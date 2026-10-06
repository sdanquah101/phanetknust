-- Prayer Wall: anonymous public topics, unique code, testimonies by code
create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  topic text not null check (char_length(topic) between 3 and 120),
  body text check (char_length(body) <= 1500),
  category text not null default 'General',
  status text not null default 'open' check (status in ('open','answered')),
  is_hidden boolean not null default false,
  pray_count int not null default 0,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index on public.prayer_requests (created_at desc);

create table public.testimonies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  body text not null check (char_length(body) between 10 and 3000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Public views never expose the code
create or replace view public.prayer_wall_public as
  select id, topic, body, category, status, pray_count, created_at, answered_at
  from public.prayer_requests where not is_hidden;

create or replace view public.testimonies_public as
  select t.id, t.body, t.created_at, r.topic, r.category, r.id as request_id
  from public.testimonies t join public.prayer_requests r on r.id = t.request_id
  where not t.is_hidden and not r.is_hidden;

create or replace function public.gen_prayer_code() returns text language sql volatile as $$
  select 'PW-' || upper(translate(encode(gen_random_bytes(4), 'base64'), '+/=0OIl', 'ABCDEFG')) ;
$$;

create or replace function public.submit_prayer_request(p_topic text, p_body text, p_category text default 'General') returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  loop
    v_code := substr(public.gen_prayer_code(), 1, 9);
    exit when not exists (select 1 from public.prayer_requests where code = v_code);
  end loop;
  insert into public.prayer_requests (code, topic, body, category) values (v_code, trim(p_topic), nullif(trim(p_body),''), coalesce(nullif(trim(p_category),''), 'General'));
  return v_code;
end $$;

create or replace function public.pray_for(p_id uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.prayer_requests set pray_count = pray_count + 1 where id = p_id and not is_hidden returning pray_count into n;
  return coalesce(n, 0);
end $$;

create or replace function public.lookup_prayer_by_code(p_code text)
returns table (id uuid, topic text, body text, category text, status text, pray_count int, created_at timestamptz, testimonies jsonb)
language sql stable security definer set search_path = public as $$
  select r.id, r.topic, r.body, r.category, r.status, r.pray_count, r.created_at,
    coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'body', t.body, 'created_at', t.created_at) order by t.created_at) from public.testimonies t where t.request_id = r.id), '[]'::jsonb)
  from public.prayer_requests r where upper(r.code) = upper(trim(p_code));
$$;

create or replace function public.submit_testimony(p_code text, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare r public.prayer_requests; v_id uuid;
begin
  select * into r from public.prayer_requests where upper(code) = upper(trim(p_code));
  if r.id is null then raise exception 'We could not find a prayer request with that code'; end if;
  insert into public.testimonies (request_id, body) values (r.id, trim(p_body)) returning id into v_id;
  update public.prayer_requests set status = 'answered', answered_at = coalesce(answered_at, now()) where id = r.id;
  return v_id;
end $$;

alter table public.prayer_requests enable row level security;
alter table public.testimonies enable row level security;
create policy "prayer: admin all" on public.prayer_requests for all using (public.is_admin()) with check (public.is_admin());
create policy "testimonies: admin all" on public.testimonies for all using (public.is_admin()) with check (public.is_admin());
grant select on public.prayer_wall_public, public.testimonies_public to anon, authenticated;
