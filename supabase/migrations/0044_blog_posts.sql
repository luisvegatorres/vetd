-- Blog posts table for the public /blog content surface.
--
-- Bilingual (en/es) per-language columns rather than JSONB, so the generated
-- Supabase types stay strongly typed and the sitemap query stays trivial.
-- Mirrors the showcase_projects pattern (slug + meta + status) but with
-- separate _en / _es fields and a status enum that supports scheduled
-- publication via published_at.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  cover_image_url text,
  tags text[] not null default '{}',
  title_en text not null,
  title_es text,
  excerpt_en text,
  excerpt_es text,
  body_md_en text not null default '',
  body_md_es text,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc);

create index blog_posts_tags_gin_idx
  on public.blog_posts using gin (tags);

create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

-- ---------- RLS ----------
-- Mirror showcase_projects (migration 0001 lines 494-510). Public read is
-- time-aware so status='scheduled' + future published_at auto-publishes when
-- the timestamp passes. No cron required.

create policy "blog_posts: public read published"
  on public.blog_posts for select
  to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

create policy "blog_posts: staff read all"
  on public.blog_posts for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor'));

create policy "blog_posts: staff write"
  on public.blog_posts for all
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));
