-- Street address on clients so sales reps have a drop-in pin for in-person visits.
-- `location` (City, State) stays as-is — the two fields serve different jobs.

alter table public.clients
  add column if not exists address text;
