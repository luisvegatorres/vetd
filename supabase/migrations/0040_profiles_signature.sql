-- Per-rep email signature, appended to outreach emails (and any future
-- rep-sent transactional emails). Plain text — paragraphs separated by
-- newlines. The renderer wraps it in a styled block for HTML and a `--`
-- delimiter for plain text. When NULL or blank, the renderer falls back to
-- a generated signature using the rep's full name + Vetd company line.

alter table public.profiles
  add column signature text;

comment on column public.profiles.signature is
  'Plain-text email signature appended to rep-sent emails (outreach, etc.). Blank means use the auto-generated default.';
