-- Per-rep availability config for the Schedule Meeting picker. Google
-- Calendar's public API does not expose the "Working hours & location"
-- preference (it only drives auto-decline inside Gmail), so every scheduling
-- tool (Cal.com, Calendly, etc.) stores these in its own database. This
-- column is that store for Vetd.
--
-- Shape:
--   {
--     "startHour": 9,            -- first bookable start time (local hour)
--     "endHour": 17,             -- last moment a meeting may end (local hour)
--     "days": [1, 2, 3, 4, 5],   -- ISO dayOfWeek: 0=Sun … 6=Sat
--     "blocks": [                -- one-off blocked date ranges (inclusive)
--       { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD", "reason": "Vacation" }
--     ]
--   }

alter table public.profiles
  add column if not exists working_hours jsonb not null default
    '{"startHour": 9, "endHour": 17, "days": [1, 2, 3, 4, 5], "blocks": []}'::jsonb;
