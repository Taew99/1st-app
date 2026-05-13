-- =============================================
-- Storage Bucket: post-images
-- Run via Supabase dashboard > SQL Editor
-- (Storage buckets cannot be created via SQL migrations directly in all versions)
-- =============================================

-- Create the public bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  TRUE,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "post_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "post_images_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "post_images_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
