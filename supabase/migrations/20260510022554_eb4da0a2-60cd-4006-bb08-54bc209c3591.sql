CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_value numeric, _partner_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, code text, description text, type text, value numeric, discount numeric, final_value numeric, message text, ok boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _c public.coupons%ROWTYPE;
  _disc numeric := 0;
  _used_by_user int := 0;
  _uid uuid := auth.uid();
BEGIN
  SELECT c.* INTO _c FROM public.coupons c
    WHERE lower(c.code) = lower(trim(_code)) LIMIT 1;

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
    SELECT count(*) INTO _used_by_user FROM public.coupon_usage cu
      WHERE cu.coupon_id = _c.id AND cu.user_id = _uid;
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
$function$;