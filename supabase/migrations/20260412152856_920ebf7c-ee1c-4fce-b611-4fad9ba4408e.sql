-- 1. Add explicit DELETE policy on user_roles restricted to admins
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Update partner-images upload policy to allow anon uploads (since partner form is public)
-- First drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can upload partner images" ON storage.objects;

-- Recreate allowing anon+authenticated (the form is public, no auth required)
CREATE POLICY "Anyone can upload partner images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'partner-images' AND octet_length(name) < 200);