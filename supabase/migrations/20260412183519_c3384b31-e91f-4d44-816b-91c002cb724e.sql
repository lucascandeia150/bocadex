
-- 1. Fix unrestricted file upload: drop old permissive policy and add restricted one
DROP POLICY IF EXISTS "Anyone can upload partner images" ON storage.objects;

CREATE POLICY "Authenticated users can upload partner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-images'
  AND octet_length(name) < 200
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
);

-- 2. Add UPDATE policy restricting to admins only
CREATE POLICY "Only admins can update partner images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 3. Fix has_role to only work with the caller's own uid
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  )
$$;
