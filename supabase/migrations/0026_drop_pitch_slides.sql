-- Pitch Mode was never built out — the /pitch-mode route was a placeholder
-- and the pitch_slides content surface is not used anywhere. Drop the table
-- (and its policies/index cascade with it) to keep the schema honest.

drop table if exists public.pitch_slides;
