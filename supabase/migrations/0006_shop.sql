-- Shop (main website): products, orders paid through Paystack, campus pickup
create sequence public.order_no_seq start 1001;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  image_url text,
  stock int not null default 0 check (stock >= 0),
  options jsonb not null default '[]'::jsonb,   -- e.g. ["S","M","L","XL"]
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  pickup_note text,
  subtotal numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','fulfilled','cancelled')),
  paystack_reference text unique,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  name text not null,
  option text,
  unit_price numeric(12,2) not null,
  qty int not null check (qty > 0)
);

-- Create a pending order from the cart (anon). Prices are read server-side.
create or replace function public.create_order(p_name text, p_email text, p_phone text, p_note text, p_items jsonb)
returns table (order_id uuid, order_no text, subtotal numeric)
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_no text; v_sub numeric := 0; it record; p public.products;
begin
  if coalesce(trim(p_name),'')='' or coalesce(trim(p_email),'')='' or coalesce(trim(p_phone),'')='' then raise exception 'Name, email and phone are required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty'; end if;
  v_no := 'PK-' || nextval('public.order_no_seq')::text;
  insert into public.orders (order_no, buyer_name, buyer_email, buyer_phone, pickup_note, subtotal) values (v_no, trim(p_name), lower(trim(p_email)), trim(p_phone), nullif(trim(p_note),''), 0) returning id into v_id;
  for it in select (e->>'product_id')::uuid as product_id, greatest(1,(e->>'qty')::int) as qty, e->>'option' as opt from jsonb_array_elements(p_items) e loop
    select * into p from public.products where id = it.product_id and is_active for update;
    if p.id is null then raise exception 'A product in your bag is no longer available'; end if;
    if p.stock < it.qty then raise exception 'Only % left of %', p.stock, p.name; end if;
    update public.products set stock = stock - it.qty where id = p.id;
    insert into public.order_items (order_id, product_id, name, option, unit_price, qty) values (v_id, p.id, p.name, it.opt, p.price, it.qty);
    v_sub := v_sub + p.price * it.qty;
  end loop;
  update public.orders set subtotal = v_sub where id = v_id;
  return query select v_id, v_no, v_sub;
end $$;

-- Public order lookup for the thank-you page (by order_no + email)
create or replace function public.order_status(p_order_no text, p_email text)
returns table (order_no text, buyer_name text, status text, subtotal numeric, paid_at timestamptz, items jsonb)
language sql stable security definer set search_path = public as $$
  select o.order_no, o.buyer_name, o.status, o.subtotal, o.paid_at,
    coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'option', i.option, 'qty', i.qty, 'unit_price', i.unit_price)) from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  from public.orders o where o.order_no = upper(trim(p_order_no)) and o.buyer_email = lower(trim(p_email));
$$;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "products: public read" on public.products for select using (is_active or public.is_admin());
create policy "products: admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "orders: admin/finance read" on public.orders for select using (public.has_any_role('admin','finance','finance_head'));
create policy "orders: admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "order_items: admin/finance read" on public.order_items for select using (public.has_any_role('admin','finance','finance_head'));
