-- PHANET Welfare: stock of groceries, member "shopping" requests without login
create sequence public.welfare_code_seq start 1;

create table public.welfare_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Groceries',
  unit text not null default 'pc',
  qty_available int not null default 0 check (qty_available >= 0),
  max_per_request int not null default 2 check (max_per_request > 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger welfare_items_touch before update on public.welfare_items for each row execute function public.touch_updated_at();

create table public.welfare_stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.welfare_items(id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('donation','purchase','issued','adjustment','returned')),
  note text,
  by_user uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.welfare_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  requester_name text not null,
  phone text not null,
  hall_room text,
  member_id uuid references public.members(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','ready','collected','declined')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);
create index on public.welfare_requests (status, created_at desc);

create table public.welfare_request_items (
  request_id uuid not null references public.welfare_requests(id) on delete cascade,
  item_id uuid not null references public.welfare_items(id),
  qty int not null check (qty > 0),
  primary key (request_id, item_id)
);

-- Anonymous members shop: validates limits & stock, reserves stock, returns the tracking code.
create or replace function public.submit_welfare_request(p_name text, p_phone text, p_hall_room text, p_note text, p_items jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text; v_id uuid; it record; v_item public.welfare_items; v_count int := 0;
begin
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then raise exception 'Name and phone are required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Pick at least one item'; end if;
  if (select count(*) from public.welfare_requests w where w.phone = p_phone and w.created_at > now() - interval '7 days' and w.status <> 'declined') >= 2 then
    raise exception 'You already have a request this week. Please check its status or contact the welfare team.';
  end if;
  v_code := 'WF-' || lpad(nextval('public.welfare_code_seq')::text, 4, '0') || '-' || upper(substr(encode(gen_random_bytes(2),'hex'),1,3));
  insert into public.welfare_requests (code, requester_name, phone, hall_room, note)
    values (v_code, trim(p_name), trim(p_phone), nullif(trim(p_hall_room),''), nullif(trim(p_note),'')) returning id into v_id;
  for it in select (e->>'item_id')::uuid as item_id, (e->>'qty')::int as qty from jsonb_array_elements(p_items) e loop
    select * into v_item from public.welfare_items where id = it.item_id and is_active for update;
    if v_item.id is null then raise exception 'Item no longer available'; end if;
    if it.qty < 1 or it.qty > v_item.max_per_request then raise exception 'You can take at most % of %', v_item.max_per_request, v_item.name; end if;
    if v_item.qty_available < it.qty then raise exception 'Only % % of % left', v_item.qty_available, v_item.unit, v_item.name; end if;
    update public.welfare_items set qty_available = qty_available - it.qty where id = v_item.id;
    insert into public.welfare_stock_movements (item_id, delta, reason, note) values (v_item.id, -it.qty, 'issued', 'Request ' || v_code);
    insert into public.welfare_request_items (request_id, item_id, qty) values (v_id, v_item.id, it.qty);
    v_count := v_count + 1;
  end loop;
  if v_count > 6 then raise exception 'A request can hold at most 6 different items'; end if;
  return v_code;
end $$;

-- Public status lookup by code (no login)
create or replace function public.welfare_request_status(p_code text)
returns table (code text, requester_name text, status text, created_at timestamptz, decision_note text, items jsonb)
language sql stable security definer set search_path = public as $$
  select r.code, r.requester_name, r.status, r.created_at, r.decision_note,
    coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'qty', ri.qty, 'unit', i.unit)) from public.welfare_request_items ri join public.welfare_items i on i.id = ri.item_id where ri.request_id = r.id), '[]'::jsonb)
  from public.welfare_requests r where upper(r.code) = upper(trim(p_code));
$$;

-- Welfare team decides. Declining returns stock.
create or replace function public.decide_welfare_request(p_id uuid, p_status text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare r public.welfare_requests; it record;
begin
  if not public.has_any_role('admin','welfare') then raise exception 'Not allowed'; end if;
  select * into r from public.welfare_requests where id = p_id for update;
  if r.id is null then raise exception 'Request not found'; end if;
  if p_status not in ('approved','ready','collected','declined') then raise exception 'Bad status'; end if;
  if p_status = 'declined' and r.status <> 'declined' then
    for it in select item_id, qty from public.welfare_request_items where request_id = p_id loop
      update public.welfare_items set qty_available = qty_available + it.qty where id = it.item_id;
      insert into public.welfare_stock_movements (item_id, delta, reason, note, by_user) values (it.item_id, it.qty, 'returned', 'Declined ' || r.code, auth.uid());
    end loop;
  end if;
  update public.welfare_requests set status = p_status, decided_by = auth.uid(), decided_at = now(), decision_note = coalesce(p_note, decision_note) where id = p_id;
end $$;

-- Adjust stock with an audit trail
create or replace function public.adjust_welfare_stock(p_item uuid, p_delta int, p_reason text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_any_role('admin','welfare') then raise exception 'Not allowed'; end if;
  update public.welfare_items set qty_available = qty_available + p_delta where id = p_item;
  insert into public.welfare_stock_movements (item_id, delta, reason, note, by_user) values (p_item, p_delta, p_reason, p_note, auth.uid());
end $$;

alter table public.welfare_items enable row level security;
alter table public.welfare_stock_movements enable row level security;
alter table public.welfare_requests enable row level security;
alter table public.welfare_request_items enable row level security;

create policy "witems: public read active" on public.welfare_items for select using (is_active or public.has_any_role('admin','welfare'));
create policy "witems: team write" on public.welfare_items for all using (public.has_any_role('admin','welfare')) with check (public.has_any_role('admin','welfare'));
create policy "wmoves: team read" on public.welfare_stock_movements for select using (public.has_any_role('admin','welfare'));
create policy "wreq: team read" on public.welfare_requests for select using (public.has_any_role('admin','welfare'));
create policy "wreq: team update" on public.welfare_requests for update using (public.has_any_role('admin','welfare')) with check (public.has_any_role('admin','welfare'));
create policy "wreqitems: team read" on public.welfare_request_items for select using (public.has_any_role('admin','welfare'));
