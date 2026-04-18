-- Avatar URLs were never going to be populated for client/owner profiles.
-- Drop the unused column and remove all avatar rendering downstream.

alter table public.profiles
  drop column if exists avatar_url;
