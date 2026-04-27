-- 1) Restringir colunas sensíveis de partner_applications para o role anon
REVOKE SELECT ON public.partner_applications FROM anon;
GRANT SELECT (
  id,
  business_name,
  business_type,
  address,
  description,
  whatsapp,
  promotions,
  logo_url,
  images,
  status,
  is_active,
  is_open,
  is_featured,
  uses_app_courier,
  created_at
) ON public.partner_applications TO anon;

-- Também restringir para authenticated (admins continuam via service role / has_role com SELECT * policy)
REVOKE SELECT ON public.partner_applications FROM authenticated;
GRANT SELECT (
  id,
  business_name,
  business_type,
  address,
  description,
  whatsapp,
  promotions,
  logo_url,
  images,
  status,
  is_active,
  is_open,
  is_featured,
  uses_app_courier,
  created_at,
  user_id,
  access_pin,
  owner_name
) ON public.partner_applications TO authenticated;

-- 2) Storage: política de upload mais restritiva no bucket partner-images
DROP POLICY IF EXISTS "Authenticated users can upload partner images" ON storage.objects;

CREATE POLICY "Approved partners or admins can upload partner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-images'
  AND octet_length(name) < 200
  AND storage.extension(name) = ANY (ARRAY['jpg','jpeg','png','webp','gif'])
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.current_partner_id() IS NOT NULL
  )
);