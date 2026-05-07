-- Add store status and commission columns
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS store_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS commission_percent numeric;

-- Validate store_status values
CREATE OR REPLACE FUNCTION public.validate_partner_store_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.store_status NOT IN ('active','paused','blocked') THEN
    RAISE EXCEPTION 'Invalid store_status: %', NEW.store_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_partner_store_status ON public.partner_applications;
CREATE TRIGGER trg_validate_partner_store_status
BEFORE INSERT OR UPDATE OF store_status ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.validate_partner_store_status();

-- Admin: update store status (active|paused|blocked)
CREATE OR REPLACE FUNCTION public.admin_set_store_status(_partner_id uuid, _status text)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF _status NOT IN ('active','paused','blocked') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;

  UPDATE public.partner_applications
    SET store_status = _status,
        is_active = CASE WHEN _status = 'blocked' THEN false ELSE is_active END,
        is_open  = CASE WHEN _status IN ('paused','blocked') THEN false ELSE is_open END
    WHERE id = _partner_id
    RETURNING * INTO _p;

  IF _p.id IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  RETURN _p;
END;
$$;

-- Admin: update commission percent
CREATE OR REPLACE FUNCTION public.admin_set_partner_commission(_partner_id uuid, _percent numeric)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  IF _percent IS NOT NULL AND (_percent < 0 OR _percent > 100) THEN
    RAISE EXCEPTION 'Comissão deve estar entre 0 e 100';
  END IF;

  UPDATE public.partner_applications
    SET commission_percent = _percent
    WHERE id = _partner_id
    RETURNING * INTO _p;

  IF _p.id IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  RETURN _p;
END;
$$;

-- Admin: regenerate access pin
CREATE OR REPLACE FUNCTION public.admin_reset_partner_pin(_partner_id uuid)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE public.partner_applications
    SET access_pin = public.generate_access_pin()
    WHERE id = _partner_id
    RETURNING * INTO _p;

  IF _p.id IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  RETURN _p;
END;
$$;

-- Admin: toggle uses_app_courier
CREATE OR REPLACE FUNCTION public.admin_toggle_uses_app_courier(_partner_id uuid, _value boolean)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.partner_applications
    SET uses_app_courier = COALESCE(_value, false)
    WHERE id = _partner_id
    RETURNING * INTO _p;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  RETURN _p;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_store_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_partner_commission(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_partner_pin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_uses_app_courier(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_store_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_partner_commission(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_partner_pin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_toggle_uses_app_courier(uuid, boolean) TO authenticated;