
-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. user_id + prep_status em deliveries
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS prep_status text NOT NULL DEFAULT 'ready';

CREATE INDEX IF NOT EXISTS idx_deliveries_user ON public.deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_prep ON public.deliveries(prep_status);

-- Validar prep_status
CREATE OR REPLACE FUNCTION public.validate_delivery_prep_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.prep_status NOT IN ('pending','preparing','ready') THEN
    RAISE EXCEPTION 'Invalid prep_status: %', NEW.prep_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_prep ON public.deliveries;
CREATE TRIGGER trg_validate_prep
  BEFORE INSERT OR UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.validate_delivery_prep_status();

-- Permitir cliente logado ler próprios pedidos
CREATE POLICY "Customers read own deliveries" ON public.deliveries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. customer_create_delivery: aceita user_id, nasce ready (fluxo automático app)
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
  _pct numeric := 8;
  _uid uuid := auth.uid();
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE id = _partner_id AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'Loja indisponível'; END IF;
  IF NOT _partner.is_open THEN RAISE EXCEPTION 'Loja fechada no momento'; END IF;
  IF NOT _partner.uses_app_courier THEN RAISE EXCEPTION 'Loja não utiliza entregador do app'; END IF;

  SELECT * INTO _settings FROM public.delivery_settings LIMIT 1;
  IF _settings.id IS NOT NULL THEN
    _payout := _settings.default_courier_payout;
    _fee := _settings.default_fee;
    _pct := COALESCE(_settings.app_fee_percent, 8);
  END IF;
  _app_fee := round(COALESCE(_order_value, 0) * (_pct / 100.0), 2);

  _notes := 'Pedido via app — Cliente: ' || COALESCE(_customer_name, 'sem nome');
  IF _customer_phone IS NOT NULL AND length(_customer_phone) > 0 THEN
    _notes := _notes || ' | Tel: ' || _customer_phone;
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

-- 4. partner_create_delivery (manual da loja): nasce 'pending'
CREATE OR REPLACE FUNCTION public.partner_create_delivery(
  _pin text,
  _order_description text,
  _delivery_address text,
  _notes text,
  _fee numeric,
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
  _delivery public.deliveries%ROWTYPE;
  _app_fee numeric := 0;
  _pct numeric := 8;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  SELECT * INTO _settings FROM public.delivery_settings LIMIT 1;
  IF _settings.id IS NOT NULL THEN
    _payout := _settings.default_courier_payout;
    _pct := COALESCE(_settings.app_fee_percent, 8);
  END IF;
  IF _partner.uses_app_courier THEN
    _app_fee := round(COALESCE(_order_value, 0) * (_pct / 100.0), 2);
  END IF;

  INSERT INTO public.deliveries (
    partner_id, partner_name, order_description, delivery_address, notes,
    fee, courier_payout, status, order_value, app_fee, prep_status
  ) VALUES (
    _partner.id, _partner.business_name, _order_description, _delivery_address,
    COALESCE(_notes, ''), COALESCE(_fee, 0), _payout, 'disponivel',
    COALESCE(_order_value, 0), _app_fee, 'pending'
  )
  RETURNING * INTO _delivery;
  RETURN _delivery;
END;
$$;

-- 5. partner_advance_prep — loja avança preparo
CREATE OR REPLACE FUNCTION public.partner_advance_prep(
  _pin text, _delivery_id uuid, _next text
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
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  SELECT * INTO _delivery FROM public.deliveries
  WHERE id = _delivery_id AND partner_id = _partner.id LIMIT 1;
  IF _delivery.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;

  IF _next = 'preparing' AND _delivery.prep_status = 'pending' THEN _allowed := true;
  ELSIF _next = 'ready' AND _delivery.prep_status IN ('pending','preparing') THEN _allowed := true;
  END IF;

  IF NOT _allowed THEN
    RAISE EXCEPTION 'Transição inválida: % -> %', _delivery.prep_status, _next;
  END IF;

  UPDATE public.deliveries
  SET prep_status = _next, updated_at = now()
  WHERE id = _delivery_id
  RETURNING * INTO _delivery;
  RETURN _delivery;
END;
$$;

-- 6. courier_list_deliveries: filtra por prep_status='ready'
CREATE OR REPLACE FUNCTION public.courier_list_deliveries(_pin text)
RETURNS TABLE(
  id uuid, partner_id uuid, partner_name text, order_description text,
  delivery_address text, notes text, fee numeric, status text, courier_id uuid,
  partner_whatsapp text, created_at timestamptz, delivery_code text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id, d.partner_id, d.partner_name, d.order_description, d.delivery_address,
    d.notes, d.fee, d.status, d.courier_id,
    p.whatsapp AS partner_whatsapp, d.created_at,
    CASE WHEN d.courier_id = c.id THEN d.delivery_code ELSE NULL END AS delivery_code
  FROM public.deliveries d
  LEFT JOIN public.partner_applications p ON p.id = d.partner_id
  JOIN public.couriers c ON c.access_pin = _pin AND c.is_active = true
  WHERE (d.status = 'disponivel' AND d.prep_status = 'ready')
     OR (d.courier_id = c.id AND d.status IN ('aceita','em_andamento'))
  ORDER BY d.created_at DESC;
$$;

-- 7. customer_list_orders — pedidos do usuário logado
CREATE OR REPLACE FUNCTION public.customer_list_orders()
RETURNS SETOF public.deliveries
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.deliveries
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 50;
$$;

-- 8. Realtime publication
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.courier_applications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.courier_applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
