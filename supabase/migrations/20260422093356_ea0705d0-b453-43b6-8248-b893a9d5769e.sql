-- Add order_value column to deliveries
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS order_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS app_fee numeric NOT NULL DEFAULT 0;

-- Update partner_create_delivery to accept order_value and compute 8% app fee
CREATE OR REPLACE FUNCTION public.partner_create_delivery(
  _pin text,
  _order_description text,
  _delivery_address text,
  _notes text,
  _fee numeric,
  _order_value numeric DEFAULT 0
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _settings public.delivery_settings%ROWTYPE;
  _payout numeric := 0;
  _delivery public.deliveries%ROWTYPE;
  _app_fee numeric := 0;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  SELECT * INTO _settings FROM public.delivery_settings LIMIT 1;
  IF _settings.id IS NOT NULL THEN
    _payout := _settings.default_courier_payout;
  END IF;

  -- Apply 8% app fee only when partner uses app courier
  IF _partner.uses_app_courier THEN
    _app_fee := round(COALESCE(_order_value, 0) * 0.08, 2);
  END IF;

  INSERT INTO public.deliveries (
    partner_id, partner_name, order_description, delivery_address, notes,
    fee, courier_payout, status, order_value, app_fee
  ) VALUES (
    _partner.id, _partner.business_name, _order_description, _delivery_address,
    COALESCE(_notes, ''), COALESCE(_fee, 0), _payout, 'disponivel',
    COALESCE(_order_value, 0), _app_fee
  )
  RETURNING * INTO _delivery;

  RETURN _delivery;
END;
$function$;