-- Clients directory: industry + freeform location used by the /clients page.

alter table public.clients
  add column if not exists industry text,
  add column if not exists location text;

create index if not exists clients_industry_idx on public.clients (industry);
