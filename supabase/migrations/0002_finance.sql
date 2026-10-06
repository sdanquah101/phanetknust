-- PHANET Finance: funds, budgets per program, inflows, expenses with tiered approval
create table public.giving_funds (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  target_amount numeric(12,2),
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  program_id uuid references public.programs(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  academic_year text not null,
  semester smallint check (semester in (1,2)),
  status text not null default 'draft' check (status in ('draft','active','closed')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger budgets_touch before update on public.budgets for each row execute function public.touch_updated_at();

create table public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  planned_amount numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create or replace function public.required_approver_role(amount numeric) returns public.app_role
language sql immutable as $$
  select case when amount < 2000 then 'finance_head'::public.app_role
              when amount < 5000 then 'cec_chair'::public.app_role
              else 'pastor'::public.app_role end;
$$;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income','expense')),
  category text not null,                    -- income: fund slug | shop | other ; expense: free text
  amount numeric(12,2) not null check (amount > 0),
  channel text not null check (channel in ('momo_mtn','telecel_cash','card','cash','bank')),
  status text not null,                      -- income: paid | counted ; expense: pending | approved | rejected | paid
  description text,
  member_id uuid references public.members(id) on delete set null,
  payer_name text,
  payer_email text,
  payer_phone text,
  reference text unique,                     -- Paystack reference or receipt no
  source text not null default 'manual' check (source in ('manual','paystack','import')),
  program_id uuid references public.programs(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  budget_id uuid references public.budgets(id) on delete set null,
  budget_line_id uuid references public.budget_lines(id) on delete set null,
  payee_name text,
  approver_role public.app_role generated always as (case when kind = 'expense' then public.required_approver_role(amount) else null end) stored,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  decision_note text,
  paid_at timestamptz,
  occurred_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_status_valid check (
    (kind = 'income' and status in ('paid','counted')) or
    (kind = 'expense' and status in ('pending','approved','rejected','paid'))
  )
);
create index on public.transactions (occurred_at desc);
create index on public.transactions (kind, status);
create index on public.transactions (program_id);
create index on public.transactions (budget_id);
create trigger transactions_touch before update on public.transactions for each row execute function public.touch_updated_at();

-- Approve / reject an expense. Enforces the GH₵ ladder: <2000 finance_head, <5000 cec_chair, >=5000 pastor.
create or replace function public.decide_expense(p_id uuid, p_decision text, p_note text default null) returns public.transactions
language plpgsql security definer set search_path = public as $$
declare t public.transactions;
begin
  select * into t from public.transactions where id = p_id for update;
  if t.id is null then raise exception 'Transaction not found'; end if;
  if t.kind <> 'expense' or t.status <> 'pending' then raise exception 'Only pending expenses can be decided'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if not (public.is_admin() or public.has_role(t.approver_role)) then
    raise exception 'This expense (GH₵ %) must be decided by %', t.amount, t.approver_role;
  end if;
  update public.transactions
     set status = p_decision, approved_by = auth.uid(), approved_at = now(), decision_note = p_note
   where id = p_id returning * into t;
  return t;
end $$;

-- Mark an approved expense as disbursed
create or replace function public.mark_expense_paid(p_id uuid, p_channel text default null) returns public.transactions
language plpgsql security definer set search_path = public as $$
declare t public.transactions;
begin
  if not public.has_any_role('admin','finance','finance_head') then raise exception 'Not allowed'; end if;
  update public.transactions set status = 'paid', paid_at = now(), channel = coalesce(p_channel, channel)
   where id = p_id and kind = 'expense' and status = 'approved' returning * into t;
  if t.id is null then raise exception 'Expense must be approved before it is paid'; end if;
  return t;
end $$;

-- Summary per budget: planned vs actual
create or replace view public.budget_summary with (security_invoker = true) as
  select b.id as budget_id, b.title, b.academic_year, b.semester, b.status, b.program_id, b.event_id,
    coalesce((select sum(planned_amount) from public.budget_lines l where l.budget_id = b.id and l.kind = 'income'),0) as planned_income,
    coalesce((select sum(planned_amount) from public.budget_lines l where l.budget_id = b.id and l.kind = 'expense'),0) as planned_expense,
    coalesce((select sum(amount) from public.transactions t where t.budget_id = b.id and t.kind = 'income'),0) as actual_income,
    coalesce((select sum(amount) from public.transactions t where t.budget_id = b.id and t.kind = 'expense' and t.status in ('approved','paid')),0) as actual_expense
  from public.budgets b;

alter table public.giving_funds enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_lines enable row level security;
alter table public.transactions enable row level security;

create policy "funds: public read" on public.giving_funds for select using (is_active or public.is_admin() or public.has_any_role('finance','finance_head'));
create policy "funds: admin/finance write" on public.giving_funds for all using (public.has_any_role('admin','finance_head')) with check (public.has_any_role('admin','finance_head'));

create policy "budgets: finance read" on public.budgets for select using (public.has_any_role('admin','finance','finance_head','cec_chair','pastor'));
create policy "budgets: finance write" on public.budgets for all using (public.has_any_role('admin','finance','finance_head')) with check (public.has_any_role('admin','finance','finance_head'));
create policy "lines: finance read" on public.budget_lines for select using (public.has_any_role('admin','finance','finance_head','cec_chair','pastor'));
create policy "lines: finance write" on public.budget_lines for all using (public.has_any_role('admin','finance','finance_head')) with check (public.has_any_role('admin','finance','finance_head'));

create policy "tx: finance read" on public.transactions for select using (public.has_any_role('admin','finance','finance_head','cec_chair','pastor'));
create policy "tx: finance insert" on public.transactions for insert with check (public.has_any_role('admin','finance','finance_head'));
create policy "tx: finance update pending/own" on public.transactions for update
  using (public.has_any_role('admin','finance','finance_head') and (kind = 'income' or status = 'pending'))
  with check (public.has_any_role('admin','finance','finance_head'));
create policy "tx: admin delete" on public.transactions for delete using (public.is_admin());
