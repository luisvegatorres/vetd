-- Adds a self-service "title" / position field to profiles. Used by outreach
-- templates via the {{rep.title}} token so reps can sign emails with their
-- role (e.g. "Founder", "Sales Lead") without hardcoding it per template.
-- Nullable: optional.
alter table public.profiles
  add column if not exists title text;

comment on column public.profiles.title is
  'Self-set job title (e.g. "Founder"). Surfaced as the {{rep.title}} token in outreach.';
