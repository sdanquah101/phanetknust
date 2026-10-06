-- Leaders' Portal: executives shepherd assigned members ("sheep"); follow-ups, weekly reports, sharing, transfers
create table public.followups (
  id uuid primary key default gen_random_uuid(),
  sheep_id uuid not null references public.members(id) on delete cascade,
  leader_id uuid not null references public.members(id) on delete cascade,
  kind text not null default 'call' check (kind in ('call','visit','text','prayer','meeting','other')),
  summary text not null,
  needs text,
  prayer_points text,
  next_action text,
  next_action_date date,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on public.followups (sheep_id, occurred_at desc);
create index on public.followups (leader_id, occurred_at desc);

create table public.followup_shares (
  followup_id uuid not null references public.followups(id) on delete cascade,
  shared_with uuid not null references public.members(id) on delete cascade,
  note text,
  shared_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (followup_id, shared_with)
);

create table public.sheep_reports (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.members(id) on delete cascade,
  sheep_id uuid not null references public.members(id) on delete cascade,
  week_start date not null,
  attended boolean not null default false,
  contacted boolean not null default false,
  wellbeing smallint check (wellbeing between 1 and 5),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sheep_id, week_start)
);
create trigger sheep_reports_touch before update on public.sheep_reports for each row execute function public.touch_updated_at();

create table public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  sheep_id uuid not null references public.members(id) on delete cascade,
  from_leader uuid references public.members(id) on delete set null,
  to_leader uuid not null references public.members(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.decide_transfer(p_id uuid, p_decision text) returns void
language plpgsql security definer set search_path = public as $$
declare t public.transfer_requests;
begin
  if not public.has_any_role('admin','database') then raise exception 'Not allowed'; end if;
  select * into t from public.transfer_requests where id = p_id for update;
  if t.id is null or t.status <> 'pending' then raise exception 'Transfer not pending'; end if;
  if p_decision = 'approved' then update public.members set leader_id = t.to_leader where id = t.sheep_id; end if;
  update public.transfer_requests set status = p_decision, decided_by = auth.uid(), decided_at = now() where id = p_id;
end $$;

-- Leaders list (members who hold the leader role), for share/transfer pickers
create or replace function public.list_leaders()
returns table (id uuid, full_name text, member_code text, department text)
language sql stable security definer set search_path = public as $$
  select m.id, public.member_full_name(m), m.member_code, m.department
  from public.members m join public.user_roles r on r.user_id = m.user_id and r.role = 'leader'
  where public.is_staff()
  order by m.last_name, m.first_name;
$$;

-- Owner of a follow-up without going through RLS (avoids policy recursion between followups and followup_shares)
create or replace function public.followup_leader(f uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select leader_id from public.followups where id = f;
$$;

create or replace function public.is_shared_with_me(f uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.followup_shares s where s.followup_id = f and s.shared_with = public.my_member_id());
$$;

alter table public.followups enable row level security;
alter table public.followup_shares enable row level security;
alter table public.sheep_reports enable row level security;
alter table public.transfer_requests enable row level security;

create policy "followups: own, shared, admin" on public.followups for select using (
  public.has_any_role('admin','database') or leader_id = public.my_member_id()
  or public.is_shared_with_me(id)
);
create policy "followups: leader insert for own sheep" on public.followups for insert with check (
  public.is_admin() or (public.has_role('leader') and leader_id = public.my_member_id()
    and exists (select 1 from public.members m where m.id = sheep_id and m.leader_id = public.my_member_id()))
);
create policy "followups: own update" on public.followups for update using (leader_id = public.my_member_id() or public.is_admin());
create policy "followups: own delete" on public.followups for delete using (leader_id = public.my_member_id() or public.is_admin());

create policy "shares: visible to parties" on public.followup_shares for select using (
  public.is_admin() or shared_with = public.my_member_id() or public.followup_leader(followup_id) = public.my_member_id()
);
create policy "shares: owner shares" on public.followup_shares for insert with check (
  public.is_admin() or public.followup_leader(followup_id) = public.my_member_id()
);
create policy "shares: owner removes" on public.followup_shares for delete using (
  public.is_admin() or public.followup_leader(followup_id) = public.my_member_id()
);

create policy "reports: own or admin read" on public.sheep_reports for select using (public.has_any_role('admin','database') or leader_id = public.my_member_id());
create policy "reports: leader writes own" on public.sheep_reports for all
  using (public.is_admin() or leader_id = public.my_member_id())
  with check (public.is_admin() or (leader_id = public.my_member_id() and exists (select 1 from public.members m where m.id = sheep_id and m.leader_id = public.my_member_id())));

create policy "transfers: parties read" on public.transfer_requests for select using (public.has_any_role('admin','database') or from_leader = public.my_member_id() or to_leader = public.my_member_id());
create policy "transfers: leader requests" on public.transfer_requests for insert with check (public.is_admin() or (public.has_role('leader') and from_leader = public.my_member_id()));
