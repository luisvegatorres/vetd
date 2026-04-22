-- Per-rep OAuth connections to external providers (Google Workspace now;
-- easy to extend to Microsoft 365 etc. later by adding rows with a different
-- `provider` value).
--
-- Activity sync (Calendar + Gmail) runs via a cron endpoint that:
--   1. Reads rep_integrations
--   2. Uses refresh_token to mint a fresh access_token when needed
--   3. Pulls recent events/messages and upserts them into `interactions`
--      using (source, source_ref) for idempotency
--
-- RLS is tight: reps can see whether they've connected (their own row), and
-- admins can see the whole roster. Tokens are never read from the browser —
-- only the service-role client (OAuth callback + cron) touches them.

create table public.rep_integrations (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null,
  google_email text,
  scopes text[] not null default '{}',
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  -- Incremental sync cursors. For Google: { calendarNextSyncToken, gmailHistoryId }
  sync_state jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_sync_error text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rep_integrations_provider_unique unique (rep_id, provider)
);

create index rep_integrations_provider_idx
  on public.rep_integrations (provider);

create trigger rep_integrations_set_updated_at
  before update on public.rep_integrations
  for each row execute function public.set_updated_at();

alter table public.rep_integrations enable row level security;

-- Reps can see whether they themselves are connected. Tokens are in the row,
-- but RLS column-level exposure is the same as table-level — the app layer
-- is responsible for never selecting token columns from the browser. To
-- enforce that, the client query only ever selects the safe columns.
create policy "rep_integrations: rep read own"
  on public.rep_integrations for select
  to authenticated
  using (rep_id = auth.uid());

create policy "rep_integrations: admin read all"
  on public.rep_integrations for select
  to authenticated
  using (public.auth_role() = 'admin');

-- No inserts/updates/deletes from the browser — everything happens via the
-- service-role client in the OAuth callback, cron sync, or admin tooling.
-- The lack of insert/update/delete policies means `anon` and `authenticated`
-- can't mutate; service_role bypasses RLS as usual.
