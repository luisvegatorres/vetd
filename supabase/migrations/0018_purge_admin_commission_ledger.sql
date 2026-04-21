-- Admins don't earn commission — the owner keeps 100% of MRR through the
-- company, not through the payout ledger. The webhook now gates ledger
-- inserts on role != 'admin' (see app/api/webhooks/stripe/route.ts), so this
-- migration deletes any historical admin-attributed rows written before that
-- gate existed.

delete from public.subscription_commission_ledger l
using public.profiles p
where l.rep_id = p.id
  and p.role = 'admin';
