-- Early lead-conversion code wrote `product = 'growth-system'` on new
-- subscriptions (a leftover plan-id from before product/plan was split).
-- The Stripe webhook and all current code set `product = 'Website'`.
-- Rewrite the stale rows so the dashboard renders them consistently.

update public.subscriptions
set product = 'Website'
where product = 'growth-system';
