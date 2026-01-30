-- Create the storage bucket for bug reports if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-reports', 'bug-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bug-reports');

-- Policy to allow authenticated users to view files (or public if needed for WhatsApp)
-- Since we need the URL for WhatsApp, public access is easier, or signed URLs.
-- Given the bucket is public=true, we just need SELECT permission.
CREATE POLICY "Allow public select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bug-reports');
