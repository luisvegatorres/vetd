-- Non-website projects (SaaS, web app, mobile, AI) can attach a monthly
-- service on top of a one-time build. The sub row is created at sale time,
-- but billing shouldn't start until the project is delivered and fully paid.
-- We park it in 'pending' until an admin/editor manually activates it.
--
-- Websites remain a pure recurring service (no one-time) and continue to
-- default to 'active' on insert — their flow is unchanged.

alter type public.subscription_status add value if not exists 'pending' before 'active';
