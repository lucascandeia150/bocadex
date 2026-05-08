
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'percent',
  value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  per_user_limit integer NOT NULL DEFAULT 1,
  partner_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (lower(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (active);

CREATE TRIGGER trg_coupons_validate_type
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coupons"
  ON public.coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Admins manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  user_id uuid,
  order_id uuid,
  payment_id uuid,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage (coupon_id);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own coupon usage"
  ON public.coupon_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all coupon usage"
  ON public.coupon_usage FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Validate coupon: returns the coupon row data + computed discount
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_value numeric, _partner_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  code text,
  description text,
  type text,
  value numeric,
  discount numeric,
  final_value numeric,
  message text,
  ok boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c public.coupons%ROWTYPE;
  _disc numeric := 0;
  _used_by_user int := 0;
  _uid uuid := auth.uid();
BEGIN
  SELECT * INTO _c FROM public.coupons
    WHERE lower(code) = lower(trim(_code)) LIMIT 1;

  IF _c.id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, _code, ''::text, ''::text, 0::numeric, 0::numeric, _order_value, 'Cupom não encontrado'::text, false;
    RETURN;
  END IF;

  IF NOT _c.active THEN
    RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value, 'Cupom desativado'::text, false;
    RETURN;
  END IF;

  IF _c.expires_at IS NOT NULL AND _c.expires_at < now() THEN
    RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value, 'Cupom expirado'::text, false;
    RETURN;
  END IF;

  IF _c.usage_limit IS NOT NULL AND _c.used_count >= _c.usage_limit THEN
    RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value, 'Cupom esgotado'::text, false;
    RETURN;
  END IF;

  IF _c.partner_id IS NOT NULL AND _partner_id IS NOT NULL AND _c.partner_id <> _partner_id THEN
    RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value, 'Cupom não válido para esta loja'::text, false;
    RETURN;
  END IF;

  IF COALESCE(_order_value,0) < COALESCE(_c.min_order,0) THEN
    RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value,
      ('Pedido mínimo de R$ ' || _c.min_order::text)::text, false;
    RETURN;
  END IF;

  IF _uid IS NOT NULL AND _c.per_user_limit IS NOT NULL AND _c.per_user_limit > 0 THEN
    SELECT count(*) INTO _used_by_user FROM public.coupon_usage
      WHERE coupon_id = _c.id AND user_id = _uid;
    IF _used_by_user >= _c.per_user_limit THEN
      RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, 0::numeric, _order_value, 'Você já utilizou este cupom'::text, false;
      RETURN;
    END IF;
  END IF;

  IF _c.type = 'percent' THEN
    _disc := round(_order_value * (_c.value / 100.0), 2);
  ELSE
    _disc := _c.value;
  END IF;

  IF _c.max_discount IS NOT NULL AND _disc > _c.max_discount THEN
    _disc := _c.max_discount;
  END IF;
  IF _disc > _order_value THEN _disc := _order_value; END IF;
  IF _disc < 0 THEN _disc := 0; END IF;

  RETURN QUERY SELECT _c.id, _c.code, _c.description, _c.type, _c.value, _disc, GREATEST(_order_value - _disc, 0)::numeric, 'OK'::text, true;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text, _order_value numeric, _partner_id uuid, _payment_id uuid, _order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _v record;
  _id uuid;
BEGIN
  SELECT * INTO _v FROM public.validate_coupon(_code, _order_value, _partner_id);
  IF NOT _v.ok THEN
    RAISE EXCEPTION '%', _v.message;
  END IF;

  INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, payment_id, discount_amount)
    VALUES (_v.id, auth.uid(), _order_id, _payment_id, _v.discount)
    RETURNING id INTO _id;

  UPDATE public.coupons SET used_count = used_count + 1, updated_at = now()
    WHERE id = _v.id;

  RETURN _id;
END;
$$;
