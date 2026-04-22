-- Document templates & generated documents.
--
-- Templates are authored in the admin UI and store a structured block body
-- (jsonb) with `{{client.x}}` / `{{project.x}}` / `{{company.x}}` tokens.
-- At render time the server resolves tokens against the real client/project
-- rows, renders to PDF with @react-pdf/renderer, uploads the PDF to the
-- `documents` Supabase Storage bucket, and writes a row to public.documents
-- that snapshots the resolved data (so later template edits don't retcon
-- what was already sent to clients).

-- ============================================================================
-- Enums
-- ============================================================================

create type public.document_kind as enum (
  'proposal',
  'contract',
  'sow',
  'nda',
  'invoice_terms'
);

create type public.document_status as enum (
  'draft',
  'sent',
  'viewed',
  'signed',
  'void'
);

-- ============================================================================
-- document_templates
-- ============================================================================

create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.document_kind not null,
  version integer not null default 1,
  -- Array of blocks: [{ type: 'heading'|'paragraph'|'kv'|'divider'|'signature', ... }]
  body jsonb not null default '[]'::jsonb,
  -- Declared variables (for UI hints); populated from body tokens at save time.
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_templates_kind_idx on public.document_templates (kind);
create index document_templates_active_idx on public.document_templates (is_active);

create trigger document_templates_set_updated_at
  before update on public.document_templates
  for each row execute function public.set_updated_at();

alter table public.document_templates enable row level security;

-- ============================================================================
-- documents (rendered instances)
-- ============================================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.document_templates (id) on delete set null,
  -- Snapshot the template version in case a later version diverges.
  template_version integer,
  kind public.document_kind not null,
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  -- Snapshot of the resolved token values used to render this PDF.
  -- Kept on the row so a later template edit cannot retcon the signed copy.
  data jsonb not null default '{}'::jsonb,
  -- Supabase Storage object path (bucket: documents). Null while status='draft'
  -- and a PDF hasn't been rendered yet.
  pdf_path text,
  status public.document_status not null default 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_client_id_idx on public.documents (client_id);
create index documents_project_id_idx on public.documents (project_id);
create index documents_status_idx on public.documents (status);
create index documents_kind_idx on public.documents (kind);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- ---------- document_templates ----------
-- Templates are firm-wide, not client-scoped. All staff can read active
-- templates so reps can generate proposals; only admins/editors can write.

create policy "document_templates: staff read active"
  on public.document_templates for select
  to authenticated
  using (
    public.auth_role() in ('admin', 'editor', 'viewer', 'sales_rep')
    and (is_active = true or public.auth_role() in ('admin', 'editor'))
  );

create policy "document_templates: staff write"
  on public.document_templates for all
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

-- ---------- documents ----------
-- A generated document is tied to a client, so visibility mirrors clients:
-- staff see everything; reps see docs for clients they can see.

create policy "documents: staff read all"
  on public.documents for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "documents: rep read via visible clients"
  on public.documents for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = documents.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "documents: staff insert"
  on public.documents for insert
  to authenticated
  with check (public.auth_role() in ('admin', 'editor'));

create policy "documents: rep insert own"
  on public.documents for insert
  to authenticated
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = documents.client_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

create policy "documents: staff update"
  on public.documents for update
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

create policy "documents: rep update own"
  on public.documents for update
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = documents.client_id and c.assigned_to = auth.uid()
    )
  )
  with check (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1 from public.clients c
      where c.id = documents.client_id and c.assigned_to = auth.uid()
    )
  );

create policy "documents: admin delete"
  on public.documents for delete
  to authenticated
  using (public.auth_role() = 'admin');

-- ============================================================================
-- Storage bucket for rendered PDFs
-- ============================================================================
-- Private bucket; PDFs are served via time-limited signed URLs from the server.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Only staff can read objects; uploads happen server-side via the service-role
-- key so no insert policy is needed for authenticated/anon.
create policy "documents storage: staff read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.auth_role() in ('admin', 'editor', 'viewer', 'sales_rep')
  );
