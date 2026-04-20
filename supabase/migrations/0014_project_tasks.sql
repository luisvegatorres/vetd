-- Project tasks: lightweight Kanban for managing project work.
-- Four columns (todo/doing/review/done) with a per-column sort_order for DnD.

create type public.task_status as enum (
  'todo',
  'doing',
  'review',
  'done'
);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  sort_order integer not null default 0,
  due_date date,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index project_tasks_project_id_idx on public.project_tasks (project_id);
create index project_tasks_status_idx on public.project_tasks (status);
create index project_tasks_assigned_to_idx on public.project_tasks (assigned_to);
create index project_tasks_sort_idx
  on public.project_tasks (project_id, status, sort_order);

create trigger project_tasks_set_updated_at
  before update on public.project_tasks
  for each row execute function public.set_updated_at();

-- Keep completed_at in sync with status='done'.
create or replace function public.sync_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done' or old is null) then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger project_tasks_sync_completed_at
  before insert or update of status on public.project_tasks
  for each row execute function public.sync_task_completed_at();

alter table public.project_tasks enable row level security;

-- Mirror the project read/write rules so reps only see tasks on projects they
-- can see, and staff have full access.

create policy "project_tasks: staff read all"
  on public.project_tasks for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

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
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "project_tasks: staff insert"
  on public.project_tasks for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor'));

create policy "project_tasks: rep insert on own projects"
  on public.project_tasks for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1
      from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = project_tasks.project_id
        and c.assigned_to = auth.uid()
    )
  );

create policy "project_tasks: staff update"
  on public.project_tasks for update
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

create policy "project_tasks: rep update on own projects"
  on public.project_tasks for update
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
  )
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1
      from public.projects p
      join public.clients c on c.id = p.client_id
      where p.id = project_tasks.project_id
        and c.assigned_to = auth.uid()
    )
  );

create policy "project_tasks: staff delete"
  on public.project_tasks for delete
  to authenticated
  using (public.auth_role() in ('admin', 'editor'));
