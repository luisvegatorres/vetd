-- Restore sales-rep visibility of unassigned leads so any rep can pick up
-- leads from the unassigned pool. Reverses the clients-table SELECT scope
-- tightened in 0016, and restores the "claim unassigned" UPDATE policy so
-- reps can assign unassigned rows to themselves (the `claimLead` server
-- action relies on this).
--
-- Downstream tables (projects, subscriptions, interactions, project_tasks,
-- subscription_invoices) stay scoped to clients assigned to the rep, per
-- 0016 — only clients visibility is relaxed.

drop policy if exists "clients: rep read own" on public.clients;

create policy "clients: rep read own + unassigned"
  on public.clients for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and (assigned_to = auth.uid() or assigned_to is null)
  );

create policy "clients: rep claim unassigned"
  on public.clients for update
  to authenticated
  using (public.auth_role() = 'sales_rep' and assigned_to is null)
  with check (public.auth_role() = 'sales_rep' and assigned_to = auth.uid());
