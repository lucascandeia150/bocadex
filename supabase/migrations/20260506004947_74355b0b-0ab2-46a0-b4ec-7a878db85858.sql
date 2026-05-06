-- Ensure RLS is on
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Grant table-level privileges so RLS can take effect for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_applications TO authenticated;
GRANT SELECT, INSERT ON public.partner_applications TO anon;

-- Consolidated admin full-access policy (idempotent)
DROP POLICY IF EXISTS "Admins full access partner_applications" ON public.partner_applications;
CREATE POLICY "Admins full access partner_applications"
ON public.partner_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
