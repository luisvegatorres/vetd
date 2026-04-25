-- Retire the now-orphaned signature column. The auto-appended outreach
-- signature was removed in favor of token-driven sign-offs in templates;
-- nothing reads or writes this column anymore.
alter table public.profiles drop column if exists signature;

-- Defensive: clear any existing title rows that don't match the curated set
-- before swapping the column type. The action already gates writes to this
-- list, but a stale row would block the cast otherwise.
update public.profiles
set title = null
where title is not null
  and title not in (
    'Founder',
    'Co-Founder',
    'CEO',
    'President',
    'Partner',
    'Sales Lead',
    'Account Executive',
    'Business Development',
    'Marketing Lead'
  );

-- Promote `title` from free text to a Postgres enum so the DB enforces the
-- same curated list surfaced in lib/profile/titles.ts. Adding a new option
-- requires both an alter type ... add value and an update to that constant.
create type public.profile_title as enum (
  'Founder',
  'Co-Founder',
  'CEO',
  'President',
  'Partner',
  'Sales Lead',
  'Account Executive',
  'Business Development',
  'Marketing Lead'
);

alter table public.profiles
  alter column title type public.profile_title
  using title::public.profile_title;

comment on column public.profiles.title is
  'Self-set job title (e.g. "Founder"). Surfaced as the {{rep.title}} token in outreach.';
