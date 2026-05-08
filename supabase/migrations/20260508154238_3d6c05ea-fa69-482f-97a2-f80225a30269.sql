
-- 1. Tabela de zonas de entrega
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  fee numeric NOT NULL DEFAULT 0,
  courier_payout numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active zones" ON public.delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage zones" ON public.delivery_zones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_delivery_zones_updated
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Taxa custom no parceiro
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS custom_delivery_fee numeric,
  ADD COLUMN IF NOT EXISTS custom_courier_payout numeric;

-- 3. Função que resolve a taxa por endereço
CREATE OR REPLACE FUNCTION public.resolve_delivery_fee(_partner_id uuid, _address text)
RETURNS TABLE(fee numeric, courier_payout numeric, source text, zone_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _p public.partner_applications%ROWTYPE;
  _s public.delivery_settings%ROWTYPE;
  _z public.delivery_zones%ROWTYPE;
  _addr_lower text := lower(coalesce(_address, ''));
  _kw text;
  _matched boolean := false;
BEGIN
  SELECT * INTO _p FROM public.partner_applications WHERE id = _partner_id;
  SELECT * INTO _s FROM public.delivery_settings LIMIT 1;

  -- Prioridade 1: taxa custom da loja
  IF _p.custom_delivery_fee IS NOT NULL THEN
    fee := _p.custom_delivery_fee;
    courier_payout := COALESCE(_p.custom_courier_payout, _s.default_courier_payout, 0);
    source := 'partner';
    zone_name := _p.business_name;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Prioridade 2: matching por zona (alguma keyword aparece no endereço)
  IF length(_addr_lower) > 0 THEN
    FOR _z IN SELECT * FROM public.delivery_zones WHERE is_active = true ORDER BY display_order, created_at LOOP
      FOREACH _kw IN ARRAY _z.keywords LOOP
        IF length(trim(_kw)) > 0 AND _addr_lower LIKE '%' || lower(trim(_kw)) || '%' THEN
          fee := _z.fee;
          courier_payout := COALESCE(NULLIF(_z.courier_payout, 0), _s.default_courier_payout, 0);
          source := 'zone';
          zone_name := _z.name;
          _matched := true;
          RETURN NEXT;
          RETURN;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  -- Prioridade 3: padrão global
  fee := COALESCE(_s.default_fee, 0);
  courier_payout := COALESCE(_s.default_courier_payout, 0);
  source := 'default';
  zone_name := 'Taxa padrão';
  RETURN NEXT;
END;
$$;

-- 4. Admin: CRUD de zonas
CREATE OR REPLACE FUNCTION public.admin_upsert_zone(
  _id uuid, _name text, _keywords text[], _fee numeric,
  _courier_payout numeric, _is_active boolean, _display_order integer
)
RETURNS public.delivery_zones
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _z public.delivery_zones%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.delivery_zones (name, keywords, fee, courier_payout, is_active, display_order)
    VALUES (_name, COALESCE(_keywords, '{}'), COALESCE(_fee,0), COALESCE(_courier_payout,0),
            COALESCE(_is_active, true), COALESCE(_display_order, 0))
    RETURNING * INTO _z;
  ELSE
    UPDATE public.delivery_zones SET
      name = _name, keywords = COALESCE(_keywords, '{}'),
      fee = COALESCE(_fee, 0), courier_payout = COALESCE(_courier_payout, 0),
      is_active = COALESCE(_is_active, true),
      display_order = COALESCE(_display_order, 0),
      updated_at = now()
    WHERE id = _id RETURNING * INTO _z;
    IF _z.id IS NULL THEN RAISE EXCEPTION 'Zona não encontrada'; END IF;
  END IF;
  RETURN _z;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_zone(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  DELETE FROM public.delivery_zones WHERE id = _id;
END;
$$;

-- 5. Admin define taxa custom de uma loja
CREATE OR REPLACE FUNCTION public.admin_set_partner_delivery_fee(
  _partner_id uuid, _fee numeric, _courier_payout numeric
)
RETURNS public.partner_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.partner_applications
    SET custom_delivery_fee = _fee,
        custom_courier_payout = _courier_payout
    WHERE id = _partner_id
    RETURNING * INTO _p;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Loja não encontrada'; END IF;
  RETURN _p;
END;
$$;

-- 6. Parceiro define a própria taxa via PIN
CREATE OR REPLACE FUNCTION public.partner_set_delivery_fee(
  _pin text, _fee numeric, _courier_payout numeric
)
RETURNS public.partner_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _p public.partner_applications%ROWTYPE;
BEGIN
  UPDATE public.partner_applications
    SET custom_delivery_fee = _fee,
        custom_courier_payout = _courier_payout,
        updated_at = now()
    WHERE access_pin = _pin AND status = 'approved' AND is_active = true
    RETURNING * INTO _p;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  RETURN _p;
END;
$$;

-- 7. customer_create_delivery agora usa resolve_delivery_fee
CREATE OR REPLACE FUNCTION public.customer_create_delivery(
  _partner_id uuid, _order_description text, _delivery_address text,
  _customer_name text, _customer_phone text, _order_value numeric DEFAULT 0
)
RETURNS public.deliveries
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _settings public.delivery_settings%ROWTYPE;
  _resolved record;
  _payout numeric := 0;
  _fee numeric := 0;
  _app_fee numeric := 0;
  _delivery public.deliveries%ROWTYPE;
  _notes text;
  _pct numeric := 8;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login obrigatório'; END IF;

  SELECT * INTO _partner FROM public.partner_applications
    WHERE id = _partner_id AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'Loja indisponível'; END IF;
  IF NOT _partner.is_open THEN RAISE EXCEPTION 'Loja fechada no momento'; END IF;
  IF NOT _partner.uses_app_courier THEN RAISE EXCEPTION 'Loja não utiliza entregador do app'; END IF;

  SELECT * INTO _settings FROM public.delivery_settings LIMIT 1;
  _pct := COALESCE(_settings.app_fee_percent, 8);

  SELECT * INTO _resolved FROM public.resolve_delivery_fee(_partner_id, _delivery_address) LIMIT 1;
  _fee := COALESCE(_resolved.fee, 0);
  _payout := COALESCE(_resolved.courier_payout, 0);

  -- Comissão só sobre subtotal de produtos
  _app_fee := round(COALESCE(_order_value, 0) * (_pct / 100.0), 2);

  _notes := 'Pedido via app — Cliente: ' || COALESCE(_customer_name, 'sem nome');
  IF _customer_phone IS NOT NULL AND length(_customer_phone) > 0 THEN
    _notes := _notes || ' | Tel: ' || _customer_phone;
  END IF;
  IF _resolved.zone_name IS NOT NULL THEN
    _notes := _notes || ' | Zona: ' || _resolved.zone_name;
  END IF;

  INSERT INTO public.deliveries (
    partner_id, partner_name, order_description, delivery_address, notes,
    fee, courier_payout, status, order_value, app_fee, user_id, prep_status
  ) VALUES (
    _partner.id, _partner.business_name, _order_description, _delivery_address,
    _notes, _fee, _payout, 'disponivel',
    COALESCE(_order_value, 0), _app_fee, _uid, 'ready'
  )
  RETURNING * INTO _delivery;
  RETURN _delivery;
END;
$$;
