-- Block reading access_pin column for non-admins via REST
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon, authenticated;

-- Defense-in-depth: require admin to call activate_partner_subscription
CREATE OR REPLACE FUNCTION public.activate_partner_subscription(_partner_id uuid, _payment_id uuid)
 RETURNS partner_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _p public.partner_applications%ROWTYPE;
BEGIN
  -- Allow service_role/system contexts (auth.uid() IS NULL) and admins only
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.partner_applications
    SET status = 'approved',
        is_active = true,
        visibility = 'public',
        is_demo = false,
        payment_status = 'paid',
        last_payment_at = now(),
        subscription_active_until = GREATEST(COALESCE(subscription_active_until, now()), now()) + interval '30 days'
    WHERE id = _partner_id
    RETURNING * INTO _p;

  IF _p.id IS NULL THEN
    RAISE EXCEPTION 'Parceiro não encontrado: %', _partner_id;
  END IF;

  RETURN _p;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.activate_partner_subscription(uuid, uuid) FROM PUBLIC, anon, authenticated;