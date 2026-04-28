-- X OAuth 2.0 issues short-lived access tokens and long-lived refresh tokens
-- when the app requests offline.access. Instagram does not use refresh tokens,
-- so this stays nullable for existing and future non-X providers.

alter table public.app_integrations
  add column refresh_token text;
