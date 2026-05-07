DROP FUNCTION IF EXISTS public.partner_login(text);

CREATE OR REPLACE FUNCTION public.partner_login(_pin text)
RETURNS TABLE(id uuid, business_name text, address text, whatsapp text, description text, logo_url text, is_open boolean, uses_app_courier boolean, is_demo boolean, store_status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, business_name, address, whatsapp, description, logo_url, is_open, uses_app_courier, is_demo,
         COALESCE(store_status, 'active') AS store_status
  FROM public.partner_applications
  WHERE access_pin = _pin
    AND status = 'approved'
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.partner_set_pause(_pin text, _paused boolean)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _new_status text;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  IF COALESCE(_partner.store_status, 'active') = 'blocked' THEN
    RAISE EXCEPTION 'Loja bloqueada pelo administrador';
  END IF;

  _new_status := CASE WHEN _paused THEN 'paused' ELSE 'active' END;

  UPDATE public.partner_applications
    SET store_status = _new_status,
        is_open = CASE WHEN _paused THEN false ELSE is_open END
    WHERE id = _partner.id
    RETURNING * INTO _partner;

  RETURN _partner;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.partner_set_pause(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_set_pause(text, boolean) TO authenticated;