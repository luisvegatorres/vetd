-- Rename the body/subject placeholder from {referenceUrl} to {referenceLink}
-- in seeded outreach templates. The new placeholder is more semantically
-- correct: the recipient-facing email substitutes it with friendly anchor
-- text (the template's reference_label, defaulting to "Click here") rather
-- than the raw URL. The server still wraps that text in a real <a> tag
-- with the URL on send.
--
-- The dialog and server both keep accepting {referenceUrl} as a legacy
-- alias, so user-edited templates that still use it continue to work.

update public.outreach_templates
set
  subject = replace(subject, '{referenceUrl}', '{referenceLink}'),
  body = replace(body, '{referenceUrl}', '{referenceLink}');
