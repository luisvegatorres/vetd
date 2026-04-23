-- Distinguish inbound leads from outbound prospects (Google Maps / rep-sourced).
-- Prospects are pre-leads we've identified but haven't heard from yet; leads are
-- people who've actually signalled interest. Both live on the Leads page — the
-- UI filters by kind so reps see leads first and prospects as a secondary queue.
--
-- After applying, regenerate Supabase types so `kind` lands in lib/supabase/types.ts.

alter table public.clients
  add column if not exists kind text not null default 'lead'
    check (kind in ('lead', 'prospect'));

create index if not exists clients_kind_idx on public.clients (kind);
