-- Outreach email templates.
--
-- Reusable email templates reps pick from the Leads page to send a
-- short pitch to a prospect (e.g. an Airbnb host without a website).
-- Body supports {leadFirstName} / {businessName} / {referenceUrl}
-- placeholders that get filled in by the compose dialog and again
-- server-side as a defense pass before sending.
--
-- Separate from public.document_templates because the lifecycle is
-- different: outreach goes out via Gmail as the rep (no PDF, no
-- signature, no per-instance snapshot). Management UI lives on the
-- /documents page as a sibling tab so reps have one place for all
-- reusable communication content.

create table public.outreach_templates (
  id uuid primary key default gen_random_uuid(),
  business_type text not null,
  label text not null,
  subject text not null,
  body text not null,
  reference_url text,
  reference_label text,
  sort_order int not null default 0,
  is_archived boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_templates_archived_idx
  on public.outreach_templates (is_archived);
create index outreach_templates_sort_idx
  on public.outreach_templates (sort_order);

create trigger outreach_templates_set_updated_at
  before update on public.outreach_templates
  for each row execute function public.set_updated_at();

alter table public.outreach_templates enable row level security;

-- Staff can read non-archived templates so the compose dialog has
-- options to show. Admins/editors can read everything (including
-- archived) so they can audit/restore from the management UI.
create policy "outreach_templates: staff read active"
  on public.outreach_templates for select
  to authenticated
  using (
    public.auth_role() in ('admin', 'editor', 'viewer', 'sales_rep')
    and (is_archived = false or public.auth_role() in ('admin', 'editor'))
  );

create policy "outreach_templates: staff write"
  on public.outreach_templates for all
  to authenticated
  using (public.auth_role() in ('admin', 'editor'))
  with check (public.auth_role() in ('admin', 'editor'));

-- Seed five starter templates. Reference URLs are placeholders pointing
-- at well-known reference sites in each vertical; admins should swap
-- these for actual sites we've built once available, via the /documents
-- → Outreach tab editor.
insert into public.outreach_templates
  (business_type, label, subject, body, reference_url, reference_label, sort_order)
values
  (
    'vacation_rental',
    'Vacation Rental Hosts (Airbnb / VRBO)',
    'A direct-booking site for {businessName}',
    E'Hi {leadFirstName},\n\nSaw your listing for {businessName}. Most short-term rental hosts I work with are losing 15-20% of every booking to platform fees, and have no way to capture repeat guests directly.\n\nA simple direct-booking site usually pays for itself in 3-4 stays. You keep the platform commission, build a guest list you actually own, and rank in Google for your area + property type.\n\nHere''s a reference of what that can look like: {referenceUrl}.\n\nWorth a quick 15-min call to see if it fits?\n\nThanks',
    'https://www.boutique-homes.com',
    'Boutique Homes',
    1
  ),
  (
    'restaurant',
    'Restaurants & Cafés',
    'A simple website for {businessName}',
    E'Hi {leadFirstName},\n\nFound {businessName} while looking around. The food looks great, but I noticed there''s no website (or the current one is hard to use on mobile). That''s costing you direct orders and reservations.\n\nA clean site with menu, hours, online ordering, and reservations usually pays for itself in the first month. You skip the 20-30% DoorDash takes on direct orders, and you show up properly when people search your name on Google.\n\nHere''s an example of what we build for restaurants: {referenceUrl}.\n\nOpen to a 15-min call this week?\n\nThanks',
    'https://www.toasttab.com/local',
    'Toast Local',
    2
  ),
  (
    'fitness',
    'Gyms, Studios & Trainers',
    'Booking + memberships for {businessName}',
    E'Hi {leadFirstName},\n\nCame across {businessName}. Solid concept. One thing that stood out: there''s no easy way for new clients to book a class or sign up online. Every missed signup is real money.\n\nA proper site with class schedule, online booking, and membership signup usually adds 10-20 new clients in the first 60 days, just by removing the friction. You also stop paying ClassPass / Mindbody monthly fees you don''t need.\n\nReference site we''ve built in this space: {referenceUrl}.\n\nWorth a quick call to see if it makes sense for you?\n\nThanks',
    'https://www.mindbodyonline.com',
    'Mindbody example',
    3
  ),
  (
    'professional_services',
    'Lawyers, Accountants & Consultants',
    'Lead capture for {businessName}',
    E'Hi {leadFirstName},\n\nSaw {businessName}. Your reputation is strong, but the website (or lack of one) doesn''t match. Prospective clients searching for a {businessName}-style service are landing on competitors instead.\n\nA professional site with clear services, case studies, and a contact form typically brings in 3-5 qualified leads per month from search alone, without paid ads. It also gives you a credible URL to put on proposals.\n\nHere''s a reference: {referenceUrl}.\n\nCould we set up a 15-min call to talk through what would fit?\n\nThanks',
    'https://www.clio.com',
    'Clio (legal)',
    4
  ),
  (
    'trades',
    'Trades (HVAC, Plumbing, Electrical, etc.)',
    'More service calls for {businessName}',
    E'Hi {leadFirstName},\n\nFound {businessName} while looking for someone in your area. Your reviews are solid, but you''re hard to find online, and the site (when there is one) doesn''t convert visitors into calls.\n\nA simple website with clear services, service area, and a "request a quote" form usually generates 5-10 extra service calls per month, just from people searching "{businessType} near me". No ads, no long-term commitment.\n\nHere''s an example: {referenceUrl}.\n\nWorth a quick call this week?\n\nThanks',
    'https://www.angi.com',
    'Angi (trades)',
    5
  );
