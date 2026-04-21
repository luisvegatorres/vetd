-- Admins don't earn commission (see 0018). This strips the plan-derived
-- signing_bonus_amount / monthly_residual_amount from admin-owned
-- subscriptions so they stop contributing to Team MRC projections. The
-- webhook now writes nulls for admin-owned subs going forward.
--
-- first_payment_at is also backfilled from started_at when missing — for
-- admin-owned subs the webhook may not have fired cleanly on the first
-- invoice, and commission flow doesn't care (admins earn no commission),
-- but leaving it null hides the sub from "is actively paying" checks.

update public.subscriptions s
set
  signing_bonus_amount = null,
  monthly_residual_amount = null,
  first_payment_at = coalesce(
    s.first_payment_at,
    (s.started_at::timestamp at time zone 'UTC')
  )
from public.profiles p
where s.sold_by = p.id
  and p.role = 'admin';
