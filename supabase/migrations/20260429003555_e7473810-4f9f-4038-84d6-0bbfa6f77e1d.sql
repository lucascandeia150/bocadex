-- 1. Adiciona colunas de auth em courier_applications
ALTER TABLE public.courier_applications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS courier_applications_user_id_unique
  ON public.courier_applications (user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS courier_applications_email_unique
  ON public.courier_applications (lower(email)) WHERE email IS NOT NULL;

-- 2. Adiciona vínculo de auth em couriers
ALTER TABLE public.couriers
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS application_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS couriers_user_id_unique
  ON public.couriers (user_id) WHERE user_id IS NOT NULL;

-- 3. Permitir que o próprio entregador leia seu cadastro
DROP POLICY IF EXISTS "Couriers can read own application" ON public.courier_applications;
CREATE POLICY "Couriers can read own application"
  ON public.courier_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Couriers can read own courier" ON public.couriers;
CREATE POLICY "Couriers can read own courier"
  ON public.couriers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Função: entregador autenticado envia cadastro
CREATE OR REPLACE FUNCTION public.courier_submit_application(
  _full_name text,
  _phone text,
  _city_neighborhood text,
  _transport_type text,
  _availability text,
  _has_experience boolean,
  _service_area text,
  _average_fee numeric,
  _notes text
)
RETURNS public.courier_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _app public.courier_applications%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Login obrigatório';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _uid;

  -- Se já existe, atualiza (caso pendente/recusado)
  SELECT * INTO _app FROM public.courier_applications WHERE user_id = _uid LIMIT 1;
  IF _app.id IS NOT NULL THEN
    IF _app.status = 'aprovado' THEN
      RAISE EXCEPTION 'Cadastro já aprovado';
    END IF;
    UPDATE public.courier_applications SET
      full_name = _full_name, phone = _phone, city_neighborhood = _city_neighborhood,
      transport_type = _transport_type, availability = _availability,
      has_experience = _has_experience, service_area = _service_area,
      average_fee = _average_fee, notes = COALESCE(_notes,''),
      status = 'pendente', email = _email, updated_at = now()
    WHERE id = _app.id RETURNING * INTO _app;
    RETURN _app;
  END IF;

  INSERT INTO public.courier_applications (
    user_id, email, full_name, phone, city_neighborhood, transport_type,
    availability, has_experience, service_area, average_fee, notes, status
  ) VALUES (
    _uid, _email, _full_name, _phone, _city_neighborhood, _transport_type,
    _availability, _has_experience, _service_area, _average_fee, COALESCE(_notes,''), 'pendente'
  ) RETURNING * INTO _app;
  RETURN _app;
END;
$$;

-- 5. Admin aprova: cria courier ativo com PIN
CREATE OR REPLACE FUNCTION public.admin_approve_courier(_application_id uuid)
RETURNS public.couriers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _app public.courier_applications%ROWTYPE;
  _courier public.couriers%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT * INTO _app FROM public.courier_applications WHERE id = _application_id;
  IF _app.id IS NULL THEN
    RAISE EXCEPTION 'Cadastro não encontrado';
  END IF;

  -- Reaproveita courier existente se já houver
  SELECT * INTO _courier FROM public.couriers WHERE application_id = _app.id LIMIT 1;
  IF _courier.id IS NULL AND _app.user_id IS NOT NULL THEN
    SELECT * INTO _courier FROM public.couriers WHERE user_id = _app.user_id LIMIT 1;
  END IF;

  IF _courier.id IS NULL THEN
    INSERT INTO public.couriers (name, phone, vehicle, is_active, user_id, email, application_id)
    VALUES (_app.full_name, _app.phone, lower(_app.transport_type), true, _app.user_id, _app.email, _app.id)
    RETURNING * INTO _courier;
  ELSE
    UPDATE public.couriers SET
      name = _app.full_name, phone = _app.phone, vehicle = lower(_app.transport_type),
      is_active = true, user_id = COALESCE(user_id, _app.user_id),
      email = COALESCE(email, _app.email), application_id = _app.id, updated_at = now()
    WHERE id = _courier.id RETURNING * INTO _courier;
  END IF;

  UPDATE public.courier_applications SET status = 'aprovado', updated_at = now() WHERE id = _app.id;
  RETURN _courier;
END;
$$;

-- 6. Admin rejeita
CREATE OR REPLACE FUNCTION public.admin_reject_courier(_application_id uuid)
RETURNS public.courier_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _app public.courier_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  UPDATE public.courier_applications SET status = 'recusado', updated_at = now()
    WHERE id = _application_id RETURNING * INTO _app;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Cadastro não encontrado'; END IF;
  -- Desativa courier vinculado, se existir
  UPDATE public.couriers SET is_active = false, updated_at = now() WHERE application_id = _app.id;
  RETURN _app;
END;
$$;

-- 7. Login do entregador via email (autenticado)
CREATE OR REPLACE FUNCTION public.courier_login_self()
RETURNS TABLE(id uuid, name text, phone text, vehicle text, is_active boolean, access_pin text, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  RETURN QUERY
    SELECT c.id, c.name, c.phone, c.vehicle, c.is_active, c.access_pin,
           COALESCE(a.status, 'aprovado') AS status
    FROM public.couriers c
    LEFT JOIN public.courier_applications a ON a.id = c.application_id
    WHERE c.user_id = _uid AND c.is_active = true
    LIMIT 1;
END;
$$;