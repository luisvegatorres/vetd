-- Seed the self-referential case study into showcase_projects so the sitemap,
-- OG images, and any future DB-driven listings can find it. The rich editorial
-- structure (problem beats, solution beats, metrics, stack) stays in
-- lib/case-studies.ts since those fields don't map to typed columns today.

insert into public.showcase_projects (
  slug,
  title,
  tagline,
  category,
  description,
  cover_image_url,
  gallery,
  meta,
  published,
  sort_order
)
values (
  'innovate-app-studios',
  'Innovate App Studios CRM',
  'Process notes on building a typed, server-first CRM end-to-end.',
  'SaaS Products',
  'We built the studio on Next.js 16, server-first by default, typed end-to-end from the Postgres schema to the UI. A walkthrough of the stack, the decisions that shaped the codebase, and the process we used to get from empty repo to running system.',
  null,
  '{}',
  jsonb_build_object(
    'locales', jsonb_build_array('en', 'es'),
    'role', 'Design, build, ship',
    'year', '2026',
    'duration', 'Ongoing'
  ),
  true,
  0
)
on conflict (slug) do nothing;
