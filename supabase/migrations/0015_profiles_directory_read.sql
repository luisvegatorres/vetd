-- Let any authenticated staff member read any profile row.
--
-- The prior policy only allowed self-reads for sales_rep/viewer, which broke
-- embedded joins like `rep:profiles!projects_sold_by_fkey` on the pipeline
-- and project views — projects assigned to another rep (typically the admin)
-- silently rendered as "Unassigned" because RLS hid the joined row.
--
-- Every authenticated user of this app is internal staff, so exposing the
-- directory fields (id, full_name, role, employment_status,
-- default_commission_rate, created_at) to all of them is acceptable.
-- Sensitive column-level visibility can be layered on via a view later if
-- the team grows and commission rates become confidential.

drop policy if exists "profiles: self or staff read" on public.profiles;

create policy "profiles: authenticated read"
  on public.profiles for select
  to authenticated
  using (true);
