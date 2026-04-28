-- AI-generated Instagram post drafts. The autonomous pipeline (admin-
-- triggered for now, cron later) generates a caption + image prompt + image
-- and writes one row here per draft. Admins review on /admin/integrations/
-- drafts and either publish (which calls the existing IG publish flow) or
-- discard. The image lives in the instagram-uploads Storage bucket under
-- the drafts/ prefix so the existing public-URL plumbing works without
-- changes.

create table public.instagram_drafts (
  id uuid primary key default gen_random_uuid(),
  topic text,
  caption text not null default '',
  image_prompt text,
  -- Path within the instagram-uploads bucket (e.g. "drafts/<uuid>.png").
  -- Null while an image is regenerating, between successful generation and
  -- the row write, or after a published draft has been pruned.
  image_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'discarded')),
  published_media_id text,
  published_permalink text,
  published_at timestamptz,
  generated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index instagram_drafts_status_created_idx
  on public.instagram_drafts (status, created_at desc);

create trigger instagram_drafts_set_updated_at
  before update on public.instagram_drafts
  for each row execute function public.set_updated_at();

alter table public.instagram_drafts enable row level security;

-- Admins can read the drafts list. All writes go through the service-role
-- client in server actions, mirroring app_integrations. No insert/update/
-- delete policies for authenticated; service_role bypasses RLS.
create policy "instagram_drafts: admin read"
  on public.instagram_drafts for select
  to authenticated
  using (public.auth_role() = 'admin');
