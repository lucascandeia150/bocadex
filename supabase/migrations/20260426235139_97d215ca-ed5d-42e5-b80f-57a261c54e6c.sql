-- 1) Coluna delivery_code
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS delivery_code text;

-- 2) Função para gerar código de 4 dígitos
CREATE OR REPLACE FUNCTION public.generate_delivery_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN lpad((floor(random() * 10000))::int::text, 4, '0');
END;
$$;

-- 3) Trigger
CREATE OR REPLACE FUNCTION public.ensure_delivery_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.delivery_code IS NULL OR length(NEW.delivery_code) = 0 THEN
    NEW.delivery_code := public.generate_delivery_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_delivery_code ON public.deliveries;
CREATE TRIGGER trg_ensure_delivery_code
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_delivery_code();

-- 4) Backfill
UPDATE public.deliveries
SET delivery_code = lpad((floor(random() * 10000))::int::text, 4, '0')
WHERE delivery_code IS NULL;

-- 5) Atualizar courier_update_delivery (assinatura nova c/ _code)
DROP FUNCTION IF EXISTS public.courier_update_delivery(text, uuid, text);
CREATE OR REPLACE FUNCTION public.courier_update_delivery(_pin text, _delivery_id uuid, _action text, _code text DEFAULT NULL)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _courier public.couriers%ROWTYPE;
  _delivery public.deliveries%ROWTYPE;
  _existing public.deliveries%ROWTYPE;
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
    SELECT * INTO _existing FROM public.deliveries
      WHERE id = _delivery_id AND courier_id = _courier.id LIMIT 1;
    IF _existing.id IS NULL THEN
      RAISE EXCEPTION 'Pedido não disponível';
    END IF;
    IF _existing.delivery_code IS NULL OR _code IS NULL OR _existing.delivery_code <> _code THEN
      RAISE EXCEPTION 'Código inválido';
    END IF;
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

-- 6) Atualizar courier_list_deliveries para retornar delivery_code
DROP FUNCTION IF EXISTS public.courier_list_deliveries(text);
CREATE OR REPLACE FUNCTION public.courier_list_deliveries(_pin text)
RETURNS TABLE(
  id uuid, partner_id uuid, partner_name text, order_description text,
  delivery_address text, notes text, fee numeric, status text, courier_id uuid,
  partner_whatsapp text, created_at timestamp with time zone, delivery_code text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    d.id, d.partner_id, d.partner_name, d.order_description, d.delivery_address,
    d.notes, d.fee, d.status, d.courier_id,
    p.whatsapp AS partner_whatsapp,
    d.created_at,
    CASE WHEN d.courier_id = c.id THEN d.delivery_code ELSE NULL END AS delivery_code
  FROM public.deliveries d
  LEFT JOIN public.partner_applications p ON p.id = d.partner_id
  JOIN public.couriers c ON c.access_pin = _pin AND c.is_active = true
  WHERE d.status = 'disponivel'
     OR (d.courier_id = c.id AND d.status IN ('aceita','em_andamento'))
  ORDER BY d.created_at DESC;
$$;
