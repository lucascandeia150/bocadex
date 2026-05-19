
-- 1) Lock down access_pin column on partner_applications and couriers
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon;
REVOKE SELECT (access_pin) ON public.partner_applications FROM authenticated;
REVOKE SELECT (access_pin) ON public.couriers FROM anon;
REVOKE SELECT (access_pin) ON public.couriers FROM authenticated;

-- 2) SECURITY DEFINER helpers to retrieve PINs only for legitimate callers
CREATE OR REPLACE FUNCTION public.partner_self_pin()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_pin FROM public.partner_applications
  WHERE user_id = auth.uid()
    AND status = 'approved'
    AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.admin_partner_pin(_partner_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pin text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT access_pin INTO _pin FROM public.partner_applications WHERE id = _partner_id;
  RETURN _pin;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_partner_pins(_partner_ids uuid[])
RETURNS TABLE(id uuid, access_pin text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT p.id, p.access_pin
  FROM public.partner_applications p
  WHERE p.id = ANY(_partner_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_courier_pin(_courier_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pin text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT access_pin INTO _pin FROM public.couriers WHERE id = _courier_id;
  RETURN _pin;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_self_pin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_partner_pin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_partner_pins(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_courier_pin(uuid) TO authenticated;

-- 3) Couriers can read their assigned deliveries
DROP POLICY IF EXISTS "Couriers read own deliveries" ON public.deliveries;
CREATE POLICY "Couriers read own deliveries"
ON public.deliveries
FOR SELECT
TO authenticated
USING (
  courier_id IN (
    SELECT id FROM public.couriers WHERE user_id = auth.uid()
  )
);

-- 4) Customers can read their own payments (via metadata.user_id)
DROP POLICY IF EXISTS "Customers read own payments" ON public.payments;
CREATE POLICY "Customers read own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (metadata->>'user_id') = (auth.uid())::text
);

-- 5) Chat participants can send messages
DROP POLICY IF EXISTS "Customers can insert own messages" ON public.messages;
CREATE POLICY "Customers can insert own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'customer'
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_id AND c.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Partners can insert own messages" ON public.messages;
CREATE POLICY "Partners can insert own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'partner'
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = chat_id AND c.partner_id = current_partner_id()
  )
);

-- 6) Realtime: allow authenticated users to subscribe to channels
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
