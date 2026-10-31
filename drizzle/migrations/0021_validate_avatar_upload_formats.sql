CREATE POLICY "Avatar uploads require supported image formats"
ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (bucket_id <> 'avatars' OR coalesce(metadata ->> 'mimetype', '') IN ('image/jpeg', 'image/png', 'image/webp'));

CREATE POLICY "Avatar replacements require supported image formats"
ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (true)
WITH CHECK (bucket_id <> 'avatars' OR coalesce(metadata ->> 'mimetype', '') IN ('image/jpeg', 'image/png', 'image/webp'));