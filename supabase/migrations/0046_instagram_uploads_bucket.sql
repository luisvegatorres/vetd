-- Public Storage bucket for images we hand to Instagram during publish.
-- Instagram fetches the image_url server-side when creating a media
-- container, so the URL must be publicly accessible. We delete the file
-- right after publish completes; if delete fails the file just lingers as
-- harmless garbage (it was going to be on @vetdagency anyway).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instagram-uploads',
  'instagram-uploads',
  true,
  8388608, -- 8 MB, matches Instagram's image limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Uploads and deletes always run via the service-role client in our API
-- route, which bypasses RLS. We deliberately add no insert/update/delete
-- policies so authenticated users can't write to the bucket directly.
-- The bucket being public=true is what lets Instagram fetch via the public
-- URL without any select policy.
