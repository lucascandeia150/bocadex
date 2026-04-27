ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

DROP FUNCTION IF EXISTS public.partner_login(text);

CREATE FUNCTION public.partner_login(_pin text)
RETURNS TABLE(id uuid, business_name text, address text, whatsapp text, description text, logo_url text, is_open boolean, uses_app_courier boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id, business_name, address, whatsapp, description, logo_url, is_open, uses_app_courier
  FROM public.partner_applications
  WHERE access_pin = _pin
    AND status = 'approved'
    AND is_active = true
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.partner_update_store(
  _pin text,
  _business_name text,
  _description text,
  _address text,
  _whatsapp text,
  _logo_url text,
  _is_open boolean
)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  UPDATE public.partner_applications
    SET business_name = COALESCE(NULLIF(trim(_business_name), ''), business_name),
        description = COALESCE(_description, description),
        address = COALESCE(NULLIF(trim(_address), ''), address),
        whatsapp = COALESCE(NULLIF(trim(_whatsapp), ''), whatsapp),
        logo_url = _logo_url,
        is_open = COALESCE(_is_open, is_open)
    WHERE id = _partner.id
    RETURNING * INTO _partner;

  RETURN _partner;
END;
$function$;

CREATE OR REPLACE FUNCTION public.partner_toggle_open(_pin text)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
BEGIN
  UPDATE public.partner_applications
    SET is_open = NOT is_open
    WHERE access_pin = _pin AND status = 'approved' AND is_active = true
    RETURNING * INTO _partner;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  RETURN _partner;
END;
$function$;

CREATE OR REPLACE FUNCTION public.customer_create_delivery(_partner_id uuid, _order_description text, _delivery_address text, _customer_name text, _customer_phone text, _order_value numeric DEFAULT 0)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _settings public.delivery_settings%ROWTYPE;
  _payout numeric := 0;
  _fee numeric := 0;
  _app_fee numeric := 0;
  _delivery public.deliveries%ROWTYPE;
  _notes text;
  _pct numeric := 8;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE id = _partner_id AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'Loja indisponível';
  END IF;

  IF NOT _partner.is_open THEN
    RAISE EXCEPTION 'Loja fechada no momento';
  END IF;

  IF NOT _partner.uses_app_courier THEN
    RAISE EXCEPTION 'Loja não utiliza entregador do app';
  END IF;

  SELECT * INTO _settings FROM public.delivery_settings LIMIT 1;
  IF _settings.id IS NOT NULL THEN
    _payout := _settings.default_courier_payout;
    _fee := _settings.default_fee;
    _pct := COALESCE(_settings.app_fee_percent, 8);
  END IF;

  _app_fee := round(COALESCE(_order_value, 0) * (_pct / 100.0), 2);

  _notes := 'Pedido via app — Cliente: ' || COALESCE(_customer_name, 'sem nome');
  IF _customer_phone IS NOT NULL AND length(_customer_phone) > 0 THEN
    _notes := _notes || ' | Tel: ' || _customer_phone;
  END IF;

  INSERT INTO public.deliveries (
    partner_id, partner_name, order_description, delivery_address, notes,
    fee, courier_payout, status, order_value, app_fee
  ) VALUES (
    _partner.id, _partner.business_name, _order_description, _delivery_address,
    _notes, _fee, _payout, 'disponivel',
    COALESCE(_order_value, 0), _app_fee
  )
  RETURNING * INTO _delivery;

  RETURN _delivery;
END;
$function$;