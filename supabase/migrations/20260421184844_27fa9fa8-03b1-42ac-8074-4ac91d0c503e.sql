-- 1. Add access_pin to partner_applications and couriers
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS access_pin text;

ALTER TABLE public.couriers
  ADD COLUMN IF NOT EXISTS access_pin text;

-- 2. Helper to generate a random 6-digit pin
CREATE OR REPLACE FUNCTION public.generate_access_pin()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  pin text;
BEGIN
  pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
  RETURN pin;
END;
$$;

-- 3. Backfill existing rows with a pin
UPDATE public.partner_applications SET access_pin = public.generate_access_pin() WHERE access_pin IS NULL;
UPDATE public.couriers SET access_pin = public.generate_access_pin() WHERE access_pin IS NULL;

-- 4. Trigger to auto-generate pin on insert if missing
CREATE OR REPLACE FUNCTION public.ensure_access_pin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.access_pin IS NULL OR length(NEW.access_pin) = 0 THEN
    NEW.access_pin := public.generate_access_pin();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS partner_applications_access_pin ON public.partner_applications;
CREATE TRIGGER partner_applications_access_pin
  BEFORE INSERT ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_access_pin();

DROP TRIGGER IF EXISTS couriers_access_pin ON public.couriers;
CREATE TRIGGER couriers_access_pin
  BEFORE INSERT ON public.couriers
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_access_pin();

-- 5. Public RPCs (security definer) for partner-side operations
CREATE OR REPLACE FUNCTION public.partner_login(_pin text)
RETURNS TABLE (id uuid, business_name text, address text, whatsapp text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, business_name, address, whatsapp
  FROM public.partner_applications
  WHERE access_pin = _pin
    AND status = 'approved'
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.partner_list_deliveries(_pin text)
RETURNS SETOF public.deliveries
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT d.*
  FROM public.deliveries d
  JOIN public.partner_applications p ON p.id = d.partner_id
  WHERE p.access_pin = _pin
    AND p.status = 'approved'
    AND p.is_active = true
  ORDER BY d.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.partner_create_delivery(
  _pin text,
  _order_description text,
  _delivery_address text,
  _notes text,
  _fee numeric
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _settings public.delivery_settings%ROWTYPE;
  _payout numeric := 0;
  _delivery public.deliveries%ROWTYPE;
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

  INSERT INTO public.deliveries (
    partner_id, partner_name, order_description, delivery_address, notes, fee, courier_payout, status
  ) VALUES (
    _partner.id, _partner.business_name, _order_description, _delivery_address,
    COALESCE(_notes, ''), COALESCE(_fee, 0), _payout, 'disponivel'
  )
  RETURNING * INTO _delivery;

  RETURN _delivery;
END;
$$;

-- 6. Public RPCs for courier-side operations
CREATE OR REPLACE FUNCTION public.courier_login(_pin text)
RETURNS TABLE (id uuid, name text, phone text, vehicle text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, phone, vehicle, is_active
  FROM public.couriers
  WHERE access_pin = _pin AND is_active = true
  LIMIT 1;
$$;

-- Available deliveries: status disponivel, plus this courier's own active ones
CREATE OR REPLACE FUNCTION public.courier_list_deliveries(_pin text)
RETURNS TABLE (
  id uuid,
  partner_id uuid,
  partner_name text,
  order_description text,
  delivery_address text,
  notes text,
  fee numeric,
  status text,
  courier_id uuid,
  partner_whatsapp text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    d.id, d.partner_id, d.partner_name, d.order_description, d.delivery_address,
    d.notes, d.fee, d.status, d.courier_id,
    p.whatsapp AS partner_whatsapp,
    d.created_at
  FROM public.deliveries d
  LEFT JOIN public.partner_applications p ON p.id = d.partner_id
  JOIN public.couriers c ON c.access_pin = _pin AND c.is_active = true
  WHERE d.status = 'disponivel'
     OR (d.courier_id = c.id AND d.status IN ('aceita','em_andamento'))
  ORDER BY d.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.courier_update_delivery(
  _pin text,
  _delivery_id uuid,
  _action text
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _courier public.couriers%ROWTYPE;
  _delivery public.deliveries%ROWTYPE;
BEGIN
  SELECT * INTO _courier FROM public.couriers
  WHERE access_pin = _pin AND is_active = true
  LIMIT 1;

  IF _courier.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  IF _action = 'accept' THEN
    UPDATE public.deliveries
      SET courier_id = _courier.id, status = 'em_andamento', updated_at = now()
      WHERE id = _delivery_id AND status = 'disponivel'
      RETURNING * INTO _delivery;
  ELSIF _action = 'finish' THEN
    UPDATE public.deliveries
      SET status = 'concluida', updated_at = now()
      WHERE id = _delivery_id AND courier_id = _courier.id
      RETURNING * INTO _delivery;
  ELSIF _action = 'release' THEN
    UPDATE public.deliveries
      SET courier_id = NULL, status = 'disponivel', updated_at = now()
      WHERE id = _delivery_id AND courier_id = _courier.id AND status IN ('aceita','em_andamento')
      RETURNING * INTO _delivery;
  ELSE
    RAISE EXCEPTION 'Ação inválida';
  END IF;

  IF _delivery.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não disponível';
  END IF;

  RETURN _delivery;
END;
$$;

-- 7. Grant execute to anon and authenticated for the public RPCs
GRANT EXECUTE ON FUNCTION public.partner_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_list_deliveries(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_create_delivery(text, text, text, text, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.courier_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.courier_list_deliveries(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.courier_update_delivery(text, uuid, text) TO anon, authenticated;