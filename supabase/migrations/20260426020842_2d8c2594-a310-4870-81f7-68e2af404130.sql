-- 1) Coluna de destaque para lojas
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partner_applications_featured
  ON public.partner_applications (is_featured)
  WHERE is_featured = true;

-- 2) Percentual de taxa configurável (substitui o 8% fixo)
ALTER TABLE public.delivery_settings
  ADD COLUMN IF NOT EXISTS app_fee_percent numeric NOT NULL DEFAULT 8;

-- 3) Atualiza funções que calculam app_fee para usar a config
CREATE OR REPLACE FUNCTION public.partner_create_delivery(
  _pin text, _order_description text, _delivery_address text,
  _notes text, _fee numeric, _order_value numeric DEFAULT 0
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
  _pct numeric := 8;
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
    _pct := COALESCE(_settings.app_fee_percent, 8);
  END IF;

  IF _partner.uses_app_courier THEN
    _app_fee := round(COALESCE(_order_value, 0) * (_pct / 100.0), 2);
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

CREATE OR REPLACE FUNCTION public.customer_create_delivery(
  _partner_id uuid, _order_description text, _delivery_address text,
  _customer_name text, _customer_phone text, _order_value numeric DEFAULT 0
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