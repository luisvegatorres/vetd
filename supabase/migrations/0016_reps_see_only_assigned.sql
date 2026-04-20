-- Tighten sales-rep visibility: reps can only read rows tied to clients
-- assigned to them. Unassigned clients are no longer visible to any rep —
-- admin distributes leads.
--
-- Previously reps could see unassigned clients and every downstream record
-- (projects, subscriptions, interactions, tasks, invoices). That allowed
-- one rep to claim all unclaimed leads and starve the rest of the team,
-- and it also bled admin-owned deals onto rep pipelines whenever the client
-- happened to be unassigned.
--
-- Scope of changes:
--   - clients: rep SELECT limited to assigned_to = auth.uid()
--   - clients: drop rep "claim unassigned" UPDATE (reps can't see them anyway)
--   - projects / subscriptions / interactions / project_tasks:
--     rep SELECT and INSERT limited to clients assigned_to = auth.uid()
--   - subscription_invoices: rep SELECT limited the same way

-- ---------- clients ----------

drop policy if exists "clients: rep read own + unassigned" on public.clients;
drop policy if exists "clients: rep claim unassigned" on public.clients;

create policy "clients: rep read own"
  on public.clients for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and assigned_to = auth.uid()
  );

-- ---------- projects ----------

drop policy if exists "projects: rep read via visible clients" on public.projects;
drop policy if exists "projects: rep insert own" on public.projects;

create policy "projects: rep read via visible clients"
  on public.projects for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id
        and c.assigned_to = auth.uid()
    )
  );

create policy "projects: rep insert own"
  on public.projects for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = projects.client_id
        and c.assigned_to = auth.uid()
    )
  );

-- ---------- interactions ----------

drop policy if exists "interactions: rep read via visible clients" on public.interactions;
drop policy if exists "interactions: rep insert own" on public.interactions;

create policy "interactions: rep read via visible clients"
  on public.interactions for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = interactions.client_id
        and c.assigned_to = auth.uid()
    )
  );

create policy "interactions: rep insert own"
  on public.interactions for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = interactions.client_id
        and c.assigned_to = auth.uid()
    )
  );

-- ---------- subscriptions ----------

drop policy if exists "subscriptions: rep read via visible clients" on public.subscriptions;

create policy "subscriptions: rep read via visible clients"
  on public.subscriptions for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = subscriptions.client_id
        and c.assigned_to = auth.uid()
    )
  );

-- ---------- subscription_invoices ----------

drop policy if exists "subscription_invoices: rep read via visible subscriptions"
  on public.subscription_invoices;

create policy "subscription_invoices: rep read via visible subscriptions"
  on public.subscription_invoices for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1
      from public.subscriptions s
      join public.clients c on c.id = s.client_id
      where s.id = subscription_invoices.subscription_id
        and c.assigned_to = auth.uid()
    )
  );

-- ---------- project_tasks ----------

drop policy if exists "project_tasks: rep read via visible projects" on public.project_tasks;

create policy "project_tasks: rep read via visible projects"
  on public.project_tasks for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1
      from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = project_tasks.project_id
        and c.assigned_to = auth.uid()
    )
  );
