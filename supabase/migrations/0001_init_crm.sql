-- Vetd CRM schema
-- Tables: profiles, clients, projects, payments, interactions, showcase_projects, pitch_slides

-- ============================================================================
-- Enums
-- ============================================================================

create type public.user_role as enum ('admin', 'editor', 'sales_rep', 'viewer');

create type public.client_status as enum (
  'lead',
  'qualified',
  'active_client',
  'archived',
  'lost'
);

create type public.client_source as enum (
  'contact_form',
  'referral',
  'cold_outreach',
  'social',
  'event',
  'rep_field',
  'other'
);

create type public.project_stage as enum (
  'proposal',
  'negotiation',
  'active',
  'completed',
  'cancelled'
);

create type public.payment_status as enum (
  'unpaid',
  'link_sent',
  'paid',
  'refunded',
  'failed'
);

create type public.interaction_type as enum (
  'call',
  'email',
  'meeting',
  'note',
  'follow_up',
  'visit'
);

-- ============================================================================
-- updated_at helper
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles (extends auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'viewer',
  avatar_url text,
  default_commission_rate numeric(5, 2),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Trigger: auto-create profile when a new auth.users row is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: returns caller's role. SECURITY DEFINER so it can read profiles
-- inside an RLS policy without recursion.
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- clients
-- ============================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  company text,
  status public.client_status not null default 'lead',
  source public.client_source not null default 'other',
  notes text,
  intake jsonb,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_status_idx on public.clients (status);
create index clients_source_idx on public.clients (source);
create index clients_assigned_to_idx on public.clients (assigned_to);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

-- ============================================================================
-- projects (deals)
-- ============================================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text,
  stage public.project_stage not null default 'proposal',
  value numeric(10, 2),
  currency text not null default 'USD',
  start_date date,
  deadline date,
  completed_at date,
  sold_by uuid references public.profiles (id) on delete set null,
  commission_rate numeric(5, 2),
  commission_amount numeric(10, 2) generated always as (
    case
      when value is null or commission_rate is null then null
      else round(value * commission_rate / 100, 2)
    end
  ) stored,
  payment_status public.payment_status not null default 'unpaid',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);
create index projects_stage_idx on public.projects (stage);
create index projects_sold_by_idx on public.projects (sold_by);
create index projects_payment_status_idx on public.projects (payment_status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

-- ============================================================================
-- payments (Stripe audit log)
-- ============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index payments_project_id_idx on public.payments (project_id);

alter table public.payments enable row level security;

-- ============================================================================
-- interactions (activity timeline)
-- ============================================================================

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  type public.interaction_type not null,
  title text not null,
  content text,
  occurred_at timestamptz not null default now(),
  logged_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index interactions_client_id_idx on public.interactions (client_id);
create index interactions_occurred_at_idx on public.interactions (occurred_at desc);

alter table public.interactions enable row level security;

-- ============================================================================
-- showcase_projects (portfolio — pitch mode + future public /work)
-- ============================================================================

create table public.showcase_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text,
  category text,
  description text,
  cover_image_url text,
  gallery text[] not null default '{}',
  meta jsonb,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index showcase_projects_published_idx on public.showcase_projects (published);
create index showcase_projects_sort_idx on public.showcase_projects (sort_order);

create trigger showcase_projects_set_updated_at
  before update on public.showcase_projects
  for each row execute function public.set_updated_at();

alter table public.showcase_projects enable row level security;

-- ============================================================================
-- pitch_slides (delivery-process slides shown on tablet)
-- ============================================================================

create table public.pitch_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index pitch_slides_sort_idx on public.pitch_slides (sort_order);

alter table public.pitch_slides enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- ---------- profiles ----------

-- Anyone authenticated can read their own profile + admins/editors can read all.
create policy "profiles: self or staff read"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.auth_role() in ('admin', 'editor')
  );

-- User can update their own profile (except the role column — enforced below).
create policy "profiles: self update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin can update any profile.
create policy "profiles: admin update any"
  on public.profiles for update
  to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

-- Prevent non-admins from changing the role column via a CHECK at trigger level.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and public.auth_role() <> 'admin' then
    raise exception 'only admins can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------- clients ----------

create policy "clients: staff read all"
  on public.clients for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "clients: rep read own + unassigned"
  on public.clients for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

create policy "clients: staff insert"
  on public.clients for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor', 'sales_rep'));

-- Anonymous contact form inserts: only leads from the contact form.
create policy "clients: anon contact form insert"
  on public.clients for insert
  to anon
  with check (status = 'lead' and source = 'contact_form');

create policy "clients: staff update"
  on public.clients for update
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

create policy "clients: rep update own"
  on public.clients for update
  to authenticated
  using (public.auth_role() = 'sales_rep' and assigned_to = auth.uid())
  with check (public.auth_role() = 'sales_rep' and assigned_to = auth.uid());

-- Claim an unassigned lead: rep can update an unassigned row if they assign it to themselves.
create policy "clients: rep claim unassigned"
  on public.clients for update
  to authenticated
  using (public.auth_role() = 'sales_rep' and assigned_to is null)
  with check (public.auth_role() = 'sales_rep' and assigned_to = auth.uid());

create policy "clients: admin delete"
  on public.clients for delete
  to authenticated
  using (public.auth_role() = 'admin');

-- ---------- projects ----------

create policy "projects: staff read all"
  on public.projects for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "projects: rep read via visible clients"
  on public.projects for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "projects: staff insert"
  on public.projects for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor'));

create policy "projects: rep insert own"
  on public.projects for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "projects: staff update"
  on public.projects for update
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

create policy "projects: rep update own"
  on public.projects for update
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id and c.assigned_to = auth.uid()
    )
  )
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id and c.assigned_to = auth.uid()
    )
  );

create policy "projects: admin delete"
  on public.projects for delete
  to authenticated
  using (public.auth_role() = 'admin');

-- ---------- interactions ----------

create policy "interactions: staff read all"
  on public.interactions for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "interactions: rep read via visible clients"
  on public.interactions for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = interactions.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "interactions: staff insert"
  on public.interactions for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor'));

create policy "interactions: rep insert own"
  on public.interactions for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = interactions.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "interactions: admin delete"
  on public.interactions for delete
  to authenticated
  using (public.auth_role() = 'admin');

-- ---------- payments ----------
-- Inserts happen via the service-role key in the Stripe webhook, so no insert
-- policy is needed for authenticated/anon roles.

create policy "payments: staff read"
  on public.payments for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor'));

create policy "payments: rep read own sales"
  on public.payments for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.projects p
      where p.id = payments.project_id and p.sold_by = auth.uid()
    )
  );

-- ---------- showcase_projects ----------

create policy "showcase: public read published"
  on public.showcase_projects for select
  to anon, authenticated
  using (published = true);

create policy "showcase: staff read all"
  on public.showcase_projects for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor'));

create policy "showcase: staff write"
  on public.showcase_projects for all
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

-- ---------- pitch_slides ----------

create policy "pitch_slides: auth read published"
  on public.pitch_slides for select
  to authenticated
  using (published = true or public.auth_role() in ('admin', 'editor'));

create policy "pitch_slides: staff write"
  on public.pitch_slides for all
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));
