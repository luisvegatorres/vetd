-- Persist a Stripe Customer per CRM client so one-time deposit checkouts and
-- recurring subscription checkouts attach to the same Customer record, instead
-- of Stripe creating a fresh "Guest" customer on every one-time payment.

alter table public.clients
  add column stripe_customer_id text unique;

comment on column public.clients.stripe_customer_id is
  'Stripe Customer ID (cus_...). Created/reused on first checkout (deposit or subscription) so repeat payments from the same CRM client land on one Customer record in Stripe.';

create index clients_stripe_customer_id_idx
  on public.clients (stripe_customer_id);
