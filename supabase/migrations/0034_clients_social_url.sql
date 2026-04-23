-- Social media handle / URL. Common for Google-Maps-sourced small businesses
-- that often only have an Instagram or Facebook presence, no website.

alter table public.clients
  add column if not exists social_url text;
