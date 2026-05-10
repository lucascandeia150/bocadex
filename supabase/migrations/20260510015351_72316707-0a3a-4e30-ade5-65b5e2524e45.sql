
-- 1) Configurações de cálculo por distância
ALTER TABLE public.delivery_settings
  ADD COLUMN IF NOT EXISTS min_fee numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS base_fee numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS per_km_fee numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS max_km numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_fee numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS free_above_subtotal numeric NOT NULL DEFAULT 0;

-- Reduzir fallback global de R$8 para R$5
UPDATE public.delivery_settings SET default_fee = 5 WHERE default_fee >= 8;

-- 2) Coordenadas da loja
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric;

-- 3) Atualizar função para suportar cálculo por distância (Haversine)
CREATE OR REPLACE FUNCTION public.resolve_delivery_fee(
  _partner_id uuid,
  _address text,
  _dest_lat numeric DEFAULT NULL,
  _dest_lng numeric DEFAULT NULL,
  _subtotal numeric DEFAULT 0
)
RETURNS TABLE(fee numeric, courier_payout numeric, source text, zone_name text, distance_km numeric, available boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _p public.partner_applications%ROWTYPE;
  _s public.delivery_settings%ROWTYPE;
  _z public.delivery_zones%ROWTYPE;
  _addr_lower text := lower(coalesce(_address, ''));
  _kw text;
  _r numeric := 6371; -- raio Terra km
  _dlat numeric;
  _dlng numeric;
  _a numeric;
  _c numeric;
  _km numeric;
  _calc_fee numeric;
BEGIN
  SELECT * INTO _p FROM public.partner_applications WHERE id = _partner_id;
  SELECT * INTO _s FROM public.delivery_settings LIMIT 1;

  -- Frete grátis acima de X
  IF _s.free_above_subtotal IS NOT NULL AND _s.free_above_subtotal > 0
     AND _subtotal >= _s.free_above_subtotal THEN
    fee := 0;
    courier_payout := COALESCE(_s.default_courier_payout, 0);
    source := 'free';
    zone_name := 'Frete grátis';
    distance_km := NULL;
    available := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 1) Taxa custom da loja (override absoluto)
  IF _p.custom_delivery_fee IS NOT NULL THEN
    fee := _p.custom_delivery_fee;
    courier_payout := COALESCE(_p.custom_courier_payout, _s.default_courier_payout, 0);
    source := 'partner';
    zone_name := _p.business_name;
    distance_km := NULL;
    available := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2) Cálculo por distância (Haversine) quando temos coords da loja e destino
  IF _p.lat IS NOT NULL AND _p.lng IS NOT NULL
     AND _dest_lat IS NOT NULL AND _dest_lng IS NOT NULL THEN
    _dlat := radians(_dest_lat - _p.lat);
    _dlng := radians(_dest_lng - _p.lng);
    _a := sin(_dlat/2)*sin(_dlat/2)
        + cos(radians(_p.lat))*cos(radians(_dest_lat))*sin(_dlng/2)*sin(_dlng/2);
    _c := 2 * atan2(sqrt(_a), sqrt(1-_a));
    _km := round((_r * _c)::numeric, 2);

    -- Fora do raio: indisponível
    IF _s.max_km IS NOT NULL AND _km > _s.max_km THEN
      fee := COALESCE(_s.max_fee, 15);
      courier_payout := COALESCE(_s.default_courier_payout, 0);
      source := 'out_of_range';
      zone_name := 'Fora da área';
      distance_km := _km;
      available := false;
      RETURN NEXT;
      RETURN;
    END IF;

    _calc_fee := COALESCE(_s.base_fee, 3) + COALESCE(_s.per_km_fee, 1.5) * _km;
    -- Aplica min/max
    _calc_fee := GREATEST(_calc_fee, COALESCE(_s.min_fee, 3));
    _calc_fee := LEAST(_calc_fee, COALESCE(_s.max_fee, 15));
    _calc_fee := round(_calc_fee::numeric, 2);

    fee := _calc_fee;
    courier_payout := COALESCE(_s.default_courier_payout, 0);
    source := 'distance';
    zone_name := _km::text || ' km';
    distance_km := _km;
    available := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 3) Matching por zona/keyword
  IF length(_addr_lower) > 0 THEN
    FOR _z IN SELECT * FROM public.delivery_zones WHERE is_active = true ORDER BY display_order, created_at LOOP
      FOREACH _kw IN ARRAY _z.keywords LOOP
        IF length(trim(_kw)) > 0 AND _addr_lower LIKE '%' || lower(trim(_kw)) || '%' THEN
          fee := _z.fee;
          courier_payout := COALESCE(NULLIF(_z.courier_payout, 0), _s.default_courier_payout, 0);
          source := 'zone';
          zone_name := _z.name;
          distance_km := NULL;
          available := true;
          RETURN NEXT;
          RETURN;
        END IF;
      END LOOP;
    END LOOP;
  END IF;

  -- 4) Fallback padrão (agora reduzido — máx R$5 inicial)
  fee := LEAST(COALESCE(_s.default_fee, 5), 5);
  courier_payout := COALESCE(_s.default_courier_payout, 0);
  source := 'default';
  zone_name := 'Taxa padrão';
  distance_km := NULL;
  available := true;
  RETURN NEXT;
END;
$function$;
