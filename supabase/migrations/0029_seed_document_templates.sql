-- Seed the two document templates we need to ship:
--   1. Project Proposal  — used before the contract, lays out scope + price.
--   2. Services Agreement — the contract the client signs before kickoff.
--
-- Both use the structured block model defined in lib/documents/blocks.ts.
-- Token tags ({{client.x}}, {{project.x}}, {{today_long}}, etc.) are
-- resolved at render time; the admin UI can override wording per template.

insert into public.document_templates (name, kind, body)
values
(
  'Project Proposal',
  'proposal',
  $json$[
    { "type": "heading", "level": 1, "text": "Project Proposal" },
    {
      "type": "paragraph",
      "text": "Prepared for {{client.business}} on {{today_long}}. This proposal summarizes the scope, timeline, and investment for the engagement outlined below. It remains valid for 30 days from the date above."
    },
    { "type": "heading", "level": 2, "text": "Engagement Summary" },
    {
      "type": "kv",
      "items": [
        { "label": "Client", "value": "{{client.business}}" },
        { "label": "Contact", "value": "{{client.name}} ▪ {{client.email}}" },
        { "label": "Project", "value": "{{project.title}}" },
        { "label": "Product", "value": "{{project.product_type}}" },
        { "label": "Target start", "value": "{{project.start_date}}" },
        { "label": "Target delivery", "value": "{{project.deadline}}" }
      ]
    },
    { "type": "heading", "level": 2, "text": "Scope" },
    { "type": "paragraph", "text": "{{project.description}}" },
    { "type": "heading", "level": 2, "text": "Investment" },
    {
      "type": "kv",
      "items": [
        { "label": "Project total", "value": "{{project.value}}" },
        { "label": "Deposit due at signing", "value": "{{project.deposit_amount}} ({{project.deposit_rate}}%)" },
        { "label": "Financing available", "value": "{{project.financing}}" }
      ]
    },
    {
      "type": "paragraph",
      "text": "Deposit secures the kickoff date. The remaining balance is invoiced against the milestones described in the Services Agreement."
    },
    { "type": "heading", "level": 2, "text": "Next Steps" },
    {
      "type": "bullets",
      "items": [
        "Reply to this proposal to confirm scope",
        "Countersign the Services Agreement",
        "Settle the deposit to lock the start date"
      ]
    },
    { "type": "spacer", "size": "lg" },
    {
      "type": "paragraph",
      "text": "Thank you for considering {{company.name}}. We're looking forward to building this with you."
    }
  ]$json$::jsonb
),
(
  'Services Agreement',
  'contract',
  $json$[
    { "type": "heading", "level": 1, "text": "Services Agreement" },
    {
      "type": "paragraph",
      "text": "This Services Agreement (\"Agreement\") is entered into on {{today_long}} between {{company.name}} (\"Provider\") and {{client.business}} (\"Client\"). By signing below, the parties agree to the terms set out in this document."
    },
    { "type": "heading", "level": 2, "text": "1. Engagement" },
    {
      "type": "paragraph",
      "text": "Provider will deliver the work described as \"{{project.title}}\": {{project.description}}"
    },
    { "type": "heading", "level": 2, "text": "2. Fees & Payment" },
    {
      "type": "paragraph",
      "text": "Client agrees to pay {{project.value}} for the engagement. A non-refundable deposit of {{project.deposit_amount}} ({{project.deposit_rate}}%) is due upon signing to secure the start date. The remainder is invoiced in line with the milestone schedule agreed in the Proposal."
    },
    { "type": "heading", "level": 2, "text": "3. Timeline" },
    {
      "type": "paragraph",
      "text": "Work begins on {{project.start_date}} and targets delivery by {{project.deadline}}, subject to the Client providing timely feedback and required materials."
    },
    { "type": "heading", "level": 2, "text": "4. Ownership" },
    {
      "type": "paragraph",
      "text": "Upon full payment, Client receives full ownership of the final deliverables, including source code, designs, domain, and accounts. Provider retains the right to reference the engagement for portfolio and marketing purposes."
    },
    { "type": "heading", "level": 2, "text": "5. Confidentiality" },
    {
      "type": "paragraph",
      "text": "Each party agrees to keep confidential any non-public information shared during the engagement, and to use such information only to fulfill this Agreement."
    },
    { "type": "heading", "level": 2, "text": "6. Termination" },
    {
      "type": "paragraph",
      "text": "Either party may terminate this Agreement with 14 days written notice. Client remains liable for work completed up to the termination date; the deposit is non-refundable."
    },
    { "type": "divider" },
    { "type": "signature", "label": "Client — {{client.name}} ({{client.business}})" },
    { "type": "signature", "label": "Provider — {{company.name}}" }
  ]$json$::jsonb
);

-- Populate the declared-variables column for each seeded template.
-- (Keeps the admin UI in sync with the tokens actually used.)
update public.document_templates
set variables = (
  select coalesce(
    jsonb_agg(distinct token order by token),
    '[]'::jsonb
  )
  from (
    select lower((m.matches)[1]) as token
    from regexp_matches(document_templates.body::text, '\{\{\s*([a-z0-9_.]+)\s*\}\}', 'gi') as m(matches)
  ) s
);
