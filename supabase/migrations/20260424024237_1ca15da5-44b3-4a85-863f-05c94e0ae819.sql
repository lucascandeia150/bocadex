CREATE OR REPLACE FUNCTION public.customer_create_delivery(
  _partner_id uuid,
  _order_description text,
  _delivery_address text,
  _customer_name text,
  _customer_phone text,
  _order_value numeric DEFAULT 0
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _settings public.delivery_settings%ROWTYPE;
  _payout numeric := 0;
  _fee numeric := 0;
  _app_fee numeric := 0;
  _delivery public.deliveries%ROWTYPE;
  _notes text;
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
  END IF;

  _app_fee := round(COALESCE(_order_value, 0) * 0.08, 2);

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
$$;

GRANT EXECUTE ON FUNCTION public.customer_create_delivery(uuid, text, text, text, text, numeric) TO anon, authenticated;