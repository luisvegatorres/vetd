-- AI-generated X (Twitter) post drafts. Mirrors instagram_drafts but:
--  • text-only (no images for now; a later migration can add x_drafts.image_path)
--  • text capped at 280 chars in app code, not enforced here
--  • status: draft / published / discarded
--  • published_post_id + published_url after publish
-- Admins generate, review, edit, publish from /admin/integrations/x/drafts.

create table public.x_drafts (
  id uuid primary key default gen_random_uuid(),
  topic text,
  text text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'discarded')),
  published_post_id text,
  published_url text,
  published_at timestamptz,
  generated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index x_drafts_status_created_idx
  on public.x_drafts (status, created_at desc);

create trigger x_drafts_set_updated_at
  before update on public.x_drafts
  for each row execute function public.set_updated_at();

alter table public.x_drafts enable row level security;

create policy "x_drafts: admin read"
  on public.x_drafts for select
  to authenticated
  using (public.auth_role() = 'admin');
