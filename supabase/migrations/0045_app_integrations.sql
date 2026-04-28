-- Org-wide OAuth connections to external providers (Instagram first; the
-- table is named generically so future single-account integrations like a
-- shared Slack workspace or a single TikTok Business account can reuse it).
--
-- Unlike rep_integrations which is keyed by (rep_id, provider), this table
-- holds a single row per provider for the whole organization. Tokens are
-- only ever read by the service-role client (OAuth callback, cron refresh,
-- and admin server actions), never from the browser.

create table public.app_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  account_id text not null,
  username text,
  access_token text not null,
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_by uuid references public.profiles (id) on delete set null,
  connected_at timestamptz not null default now(),
  last_refreshed_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger app_integrations_set_updated_at
  before update on public.app_integrations
  for each row execute function public.set_updated_at();

alter table public.app_integrations enable row level security;

-- Admins can see whether a provider is connected (used by the integrations
-- page to render the card). Tokens live in the row but the page query only
-- selects safe columns; the service-role client is the only path that reads
-- access_token.
create policy "app_integrations: admin read"
  on public.app_integrations for select
  to authenticated
  using (public.auth_role() = 'admin');

-- No insert/update/delete policies: the OAuth callback, refresh cron, and
-- disconnect server action all use the service-role client which bypasses
-- RLS. Browser clients can never mutate tokens directly.
