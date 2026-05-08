
-- Phase 2: app_versions extensions
ALTER TABLE public.app_versions
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS force_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Phase 5: courier presence
ALTER TABLE public.couriers
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Phase 3: realtime
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payments';
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Courier presence RPCs
CREATE OR REPLACE FUNCTION public.courier_set_online(_pin text, _online boolean)
RETURNS public.couriers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _c public.couriers%ROWTYPE;
BEGIN
  UPDATE public.couriers
    SET is_online = COALESCE(_online, false),
        last_seen_at = now(),
        updated_at = now()
    WHERE access_pin = _pin AND is_active = true
    RETURNING * INTO _c;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  RETURN _c;
END;
$$;

CREATE OR REPLACE FUNCTION public.courier_heartbeat(_pin text)
RETURNS public.couriers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _c public.couriers%ROWTYPE;
BEGIN
  UPDATE public.couriers
    SET last_seen_at = now()
    WHERE access_pin = _pin AND is_active = true
    RETURNING * INTO _c;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  RETURN _c;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_offline_inactive_couriers()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _n integer := 0;
BEGIN
  WITH upd AS (
    UPDATE public.couriers
      SET is_online = false
      WHERE is_online = true
        AND (last_seen_at IS NULL OR last_seen_at < now() - interval '5 minutes')
      RETURNING 1
  ) SELECT count(*) INTO _n FROM upd;
  RETURN _n;
END;
$$;

CREATE OR REPLACE FUNCTION public.courier_list_online()
RETURNS TABLE(id uuid, user_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, user_id FROM public.couriers
  WHERE is_active = true AND is_online = true;
$$;

-- Admin courier management
CREATE OR REPLACE FUNCTION public.admin_reset_courier_pin(_courier_id uuid)
RETURNS public.couriers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _c public.couriers%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.couriers
    SET access_pin = public.generate_access_pin(), updated_at = now()
    WHERE id = _courier_id
    RETURNING * INTO _c;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Entregador não encontrado'; END IF;
  RETURN _c;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_toggle_courier_active(_courier_id uuid, _active boolean)
RETURNS public.couriers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _c public.couriers%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.couriers
    SET is_active = COALESCE(_active, is_active),
        is_online = CASE WHEN COALESCE(_active, is_active) = false THEN false ELSE is_online END,
        updated_at = now()
    WHERE id = _courier_id
    RETURNING * INTO _c;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Entregador não encontrado'; END IF;
  RETURN _c;
END;
$$;

-- Demo courier (PIN 00000000)
INSERT INTO public.couriers (name, phone, vehicle, is_active, access_pin)
SELECT 'Entregador Demo', '+5500000000000', 'moto', true, '00000000'
WHERE NOT EXISTS (SELECT 1 FROM public.couriers WHERE access_pin = '00000000');

UPDATE public.couriers
  SET is_active = true, name = COALESCE(NULLIF(name, ''), 'Entregador Demo'), vehicle = COALESCE(NULLIF(vehicle, ''), 'moto')
  WHERE access_pin = '00000000';
