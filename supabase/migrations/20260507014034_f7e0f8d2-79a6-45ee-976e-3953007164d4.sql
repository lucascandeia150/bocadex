
-- 1) Lock down activate_partner_subscription: only service role
REVOKE EXECUTE ON FUNCTION public.activate_partner_subscription(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- 2) Hide access_pin column from clients
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon, authenticated;
REVOKE SELECT (access_pin) ON public.couriers FROM anon, authenticated;

-- 3) Tighten payments INSERT policy
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Authenticated can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
