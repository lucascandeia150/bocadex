CREATE OR REPLACE FUNCTION public.partner_link_user(_pin text, _user_id uuid)
 RETURNS partner_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login obrigatório';
  END IF;
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  IF _partner.user_id IS NOT NULL AND _partner.user_id <> _user_id THEN
    RAISE EXCEPTION 'Loja já vinculada a outro usuário';
  END IF;

  UPDATE public.partner_applications
    SET user_id = _user_id
    WHERE id = _partner.id
    RETURNING * INTO _partner;

  RETURN _partner;
END;
$function$;