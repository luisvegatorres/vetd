-- Subscriptions: track who closed the deal (mirrors projects.sold_by).
-- Also drops the stop-gap `owner_display_name` / `owner_id` fields — account
-- ownership already lives on `clients.assigned_to`; this column is the closer.

alter table public.subscriptions
  add column sold_by uuid references public.profiles (id) on delete set null;

create index subscriptions_sold_by_idx on public.subscriptions (sold_by);

alter table public.subscriptions drop column owner_display_name;
alter table public.subscriptions drop column owner_id;
