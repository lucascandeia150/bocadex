
-- Allow authenticated role to read access_pin again (admins via admin panel,
-- partners viewing their own row). Anon stays revoked, which is what fixes the finding.
GRANT SELECT (access_pin) ON public.partner_applications TO authenticated;
