-- PHANET KNUST · core schema: auth profiles, roles, members, programs, events, attendance, settings
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','leader','finance','finance_head','cec_chair','pastor','welfare','usher','database');

-- ---------- profiles & roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r);
$$;

create or replace function public.has_any_role(variadic rs public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = any (rs));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

create or replace function public.my_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select member_id from public.profiles where id = auth.uid();
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- members ----------
create sequence public.member_code_seq start 1;

create table public.members (
  id uuid primary key default gen_random_uuid(),
  member_code text unique,
  first_name text not null,
  last_name text not null,
  other_names text,
  gender text check (gender in ('male','female')),
  dob date,
  phone text,
  whatsapp text,
  email text,
  photo_path text,
  programme text,
  college text,
  year_of_study text,
  hall text,
  room text,
  residence_type text check (residence_type in ('hall','hostel','home','other')),
  hometown text,
  region text,
  emergency_contact_name text,
  emergency_contact_phone text,
  membership_status text not null default 'active' check (membership_status in ('active','inactive','alumni','visitor')),
  joined_at date,
  baptized boolean,
  department text,
  leader_id uuid references public.members(id) on delete set null,
  user_id uuid unique references auth.users(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.members (leader_id);
create index on public.members (lower(last_name), lower(first_name));

create or replace function public.set_member_code() returns trigger language plpgsql as $$
begin
  if new.member_code is null then
    new.member_code := 'PHA-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.member_code_seq')::text, 4, '0');
  end if;
  return new;
end $$;
create trigger members_code before insert on public.members for each row execute function public.set_member_code();
create trigger members_touch before update on public.members for each row execute function public.touch_updated_at();

-- link profile -> member (and keep in sync when a member row gets a user_id)
alter table public.profiles add constraint profiles_member_fk foreign key (member_id) references public.members(id) on delete set null;

create or replace function public.sync_member_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null then
    update public.profiles set member_id = new.id where id = new.user_id;
  end if;
  return new;
end $$;
create trigger members_sync_user after insert or update of user_id on public.members for each row execute function public.sync_member_user();

create or replace function public.member_full_name(m public.members) returns text language sql immutable as $$
  select trim(m.first_name || ' ' || coalesce(m.other_names || ' ', '') || m.last_name);
$$;

-- Staff member search without exposing full rows. Returns limited columns.
create or replace function public.search_members(q text, lim int default 20)
returns table (id uuid, member_code text, full_name text, photo_path text, hall text, programme text, year_of_study text, leader_id uuid, phone text)
language sql stable security definer set search_path = public as $$
  select m.id, m.member_code, public.member_full_name(m), m.photo_path, m.hall, m.programme, m.year_of_study, m.leader_id,
         case when public.has_any_role('admin','database','leader') then m.phone else null end
  from public.members m
  where public.is_staff()
    and m.membership_status <> 'inactive'
    and (q is null or q = '' or
         public.member_full_name(m) ilike '%' || q || '%' or m.member_code ilike '%' || q || '%' or m.phone ilike '%' || q || '%')
  order by m.last_name, m.first_name
  limit lim;
$$;

-- ---------- programs & events ----------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  schedule_label text,          -- "MON–FRI · 5:30AM"
  location text,
  cover_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.programs(id) on delete set null,
  title text not null,
  slug text unique,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  cover_url text,
  is_public boolean not null default true,
  academic_year text,
  semester smallint check (semester in (1,2)),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.events (starts_at desc);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  marked_by uuid references auth.users(id),
  method text not null default 'usher' check (method in ('usher','leader','self','import')),
  marked_at timestamptz not null default now(),
  unique (event_id, member_id)
);
create index on public.attendance (member_id);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.members enable row level security;
alter table public.programs enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.site_settings enable row level security;

create policy "profiles: own or staff read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles: own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "roles: own read" on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy "roles: admin write" on public.user_roles for all using (public.is_admin()) with check (public.is_admin());

create policy "members: database/admin read" on public.members for select using (public.has_any_role('admin','database'));
create policy "members: leader reads own sheep" on public.members for select using (public.has_role('leader') and (leader_id = public.my_member_id() or id = public.my_member_id()));
create policy "members: database/admin write" on public.members for all using (public.has_any_role('admin','database')) with check (public.has_any_role('admin','database'));

create policy "programs: public read" on public.programs for select using (is_active or public.is_admin());
create policy "programs: admin write" on public.programs for all using (public.is_admin()) with check (public.is_admin());

create policy "events: public read" on public.events for select using (is_public or public.is_staff());
create policy "events: admin/database write" on public.events for all using (public.has_any_role('admin','database')) with check (public.has_any_role('admin','database'));

create policy "attendance: staff read" on public.attendance for select using (public.has_any_role('admin','database','usher','leader','finance','finance_head'));
create policy "attendance: ushers mark" on public.attendance for insert with check (public.has_any_role('admin','database','usher'));
create policy "attendance: leaders mark own sheep" on public.attendance for insert with check (
  public.has_role('leader') and exists (select 1 from public.members m where m.id = member_id and m.leader_id = public.my_member_id())
);
create policy "attendance: unmark" on public.attendance for delete using (public.has_any_role('admin','database') or marked_by = auth.uid());

create policy "settings: public read" on public.site_settings for select using (true);
create policy "settings: admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- Attendance counts per event for staff dashboards
create or replace view public.event_attendance_counts with (security_invoker = true) as
  select e.id as event_id, e.title, e.starts_at, count(a.id)::int as attendees
  from public.events e left join public.attendance a on a.event_id = e.id
  group by e.id;
