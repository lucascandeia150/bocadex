-- Realtime: payments
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments' AND schemaname = 'public'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  END IF;
END$$;

-- RPC para a loja avançar status do pedido manualmente
-- Fluxo permitido (sem entregador do app):
--   disponivel -> aceita (em preparo)
--   aceita -> em_andamento (saiu para entrega)
--   em_andamento -> concluida (entregue)
CREATE OR REPLACE FUNCTION public.partner_advance_delivery_status(
  _pin text,
  _delivery_id uuid,
  _next_status text
)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _delivery public.deliveries%ROWTYPE;
  _allowed boolean := false;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  SELECT * INTO _delivery
  FROM public.deliveries
  WHERE id = _delivery_id AND partner_id = _partner.id
  LIMIT 1;

  IF _delivery.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  IF _next_status = 'aceita' AND _delivery.status = 'disponivel' THEN
    _allowed := true;
  ELSIF _next_status = 'em_andamento' AND _delivery.status IN ('disponivel','aceita') THEN
    _allowed := true;
  ELSIF _next_status = 'concluida' AND _delivery.status IN ('aceita','em_andamento') THEN
    _allowed := true;
  ELSIF _next_status = 'cancelada' AND _delivery.status IN ('disponivel','aceita') THEN
    _allowed := true;
  END IF;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', _delivery.status, _next_status;
  END IF;

  UPDATE public.deliveries
  SET status = _next_status, updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _delivery;

  RETURN _delivery;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_advance_delivery_status(text, uuid, text) TO anon, authenticated;