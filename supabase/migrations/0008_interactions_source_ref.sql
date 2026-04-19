-- Allow interactions rows to carry a stable external reference (e.g. Cal.com booking uid),
-- used by the Cal.com webhook to upsert on BOOKING_CREATED / RESCHEDULED / CANCELLED.

alter table public.interactions
  add column if not exists source text,
  add column if not exists source_ref text,
  add column if not exists source_payload jsonb;

create unique index if not exists interactions_source_source_ref_key
  on public.interactions (source, source_ref)
  where source is not null and source_ref is not null;
