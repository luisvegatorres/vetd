-- Projects: financing flag for builds ≥ $5K where the 70% balance is spread
-- over 12 months instead of being due on delivery.
-- Subscriptions: optional link back to the originating project, so a website
-- build can carry an attached recurring plan (Presence, Growth, Custom).

-- ============================================================================
-- projects.financing_enabled
-- ============================================================================

alter table public.projects
  add column financing_enabled boolean not null default false;

-- Financing is only meaningful for priced builds at or above the eligibility
-- threshold. The threshold itself lives in `lib/site.ts` (financing.minAmount)
-- and can change over time, so the check allows any priced project to opt in
-- and leaves enforcement to the UI / server actions.
alter table public.projects
  add constraint projects_financing_requires_value
  check (financing_enabled = false or (value is not null and value > 0));

-- ============================================================================
-- subscriptions.project_id
-- ============================================================================

alter table public.subscriptions
  add column project_id uuid references public.projects (id) on delete set null;

create index subscriptions_project_id_idx on public.subscriptions (project_id);
