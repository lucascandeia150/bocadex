-- 1) Restrict access_pin column visibility on partner_applications
-- The public anon SELECT policy exposes all columns; revoke column-level
-- SELECT on access_pin from anon so PINs are never returned to unauthenticated clients.
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon;
REVOKE SELECT (access_pin) ON public.partner_applications FROM authenticated;

-- Re-grant SELECT on access_pin only to admin context via security definer functions
-- (admins already use has_role-based policies via authenticated role; grant back to authenticated
-- but rely on RLS — simpler: grant only to service_role which bypasses anyway).
-- Admins read via the admin SELECT policy; they need column privilege too.
-- We grant access_pin SELECT back to authenticated; RLS still restricts rows to admins/owners.
GRANT SELECT (access_pin) ON public.partner_applications TO authenticated;

-- 2) Tighten storage INSERT policy: require file path to start with the partner's own id
DROP POLICY IF EXISTS "Approved partners or admins can upload partner images" ON storage.objects;

CREATE POLICY "Approved partners or admins can upload partner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-images'
  AND octet_length(name) < 200
  AND storage.extension(name) = ANY (ARRAY['jpg','jpeg','png','webp','gif'])
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      current_partner_id() IS NOT NULL
      AND (
        name LIKE current_partner_id()::text || '/%'
        OR split_part(name, '/', 1) = current_partner_id()::text
      )
    )
  )
);