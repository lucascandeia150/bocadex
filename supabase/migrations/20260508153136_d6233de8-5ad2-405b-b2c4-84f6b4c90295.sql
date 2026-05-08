-- 1) Cliente cancela próprio pedido enquanto está aguardando entregador
CREATE OR REPLACE FUNCTION public.customer_cancel_delivery(_delivery_id uuid)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d public.deliveries%ROWTYPE;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Login obrigatório';
  END IF;

  SELECT * INTO _d FROM public.deliveries
  WHERE id = _delivery_id AND user_id = _uid
  LIMIT 1;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;

  IF _d.status NOT IN ('disponivel') OR _d.courier_id IS NOT NULL THEN
    RAISE EXCEPTION 'Pedido já em andamento — fale com a loja';
  END IF;

  UPDATE public.deliveries
  SET status = 'cancelada', updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _d;

  RETURN _d;
END;
$$;

-- 2) Admin força atribuição de entregador
CREATE OR REPLACE FUNCTION public.admin_assign_courier(_delivery_id uuid, _courier_id uuid)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d public.deliveries%ROWTYPE;
  _c public.couriers%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO _c FROM public.couriers WHERE id = _courier_id AND is_active = true LIMIT 1;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Entregador inválido'; END IF;

  UPDATE public.deliveries
  SET courier_id = _courier_id,
      status = CASE WHEN status = 'disponivel' THEN 'aceita' ELSE status END,
      updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _d;

  IF _d.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  RETURN _d;
END;
$$;

-- 3) Lista entregadores ativos (qualquer admin pode ver via SELECT já permitido).
-- Apenas helper público para mostrar quem está online no momento.
CREATE OR REPLACE FUNCTION public.admin_list_active_couriers()
RETURNS TABLE(id uuid, name text, phone text, vehicle text, is_online boolean, last_seen_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, phone, vehicle, is_online, last_seen_at
  FROM public.couriers
  WHERE is_active = true
  ORDER BY is_online DESC, name;
$$;