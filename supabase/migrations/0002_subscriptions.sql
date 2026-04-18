-- Recurring products (MRR) — subscriptions table
-- Tracks monthly-billed engagements separately from one-shot `projects` deals.

-- ============================================================================
-- Enum
-- ============================================================================

create type public.subscription_status as enum ('active', 'at_risk', 'canceled');

-- ============================================================================
-- subscriptions
-- ============================================================================

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete set null,
  owner_display_name text,
  product text not null,
  plan text not null,
  monthly_rate numeric(10, 2) not null,
  currency text not null default 'USD',
  status public.subscription_status not null default 'active',
  started_at date not null,
  canceled_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_client_id_idx on public.subscriptions (client_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_owner_id_idx on public.subscriptions (owner_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

-- ============================================================================
-- RLS policies (mirror projects)
-- ============================================================================

create policy "subscriptions: staff read all"
  on public.subscriptions for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "subscriptions: rep read via visible clients"
  on public.subscriptions for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = subscriptions.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "subscriptions: staff insert"
  on public.subscriptions for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor'));

create policy "subscriptions: staff update"
  on public.subscriptions for update
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

create policy "subscriptions: admin delete"
  on public.subscriptions for delete
  to authenticated
  using (public.auth_role() = 'admin');
