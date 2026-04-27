-- 1. Add user_id link to partners
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS partner_applications_user_id_key
  ON public.partner_applications(user_id) WHERE user_id IS NOT NULL;

-- 2. Helper: which partner does the current authenticated user own?
CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.partner_applications
  WHERE user_id = auth.uid()
    AND status = 'approved'
    AND is_active = true
  LIMIT 1;
$$;

-- 3. Link a user to a partner using the existing PIN as proof
CREATE OR REPLACE FUNCTION public.partner_link_user(_pin text, _user_id uuid)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _partner public.partner_applications%ROWTYPE;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário inválido';
  END IF;

  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  -- If already linked to someone else, block
  IF _partner.user_id IS NOT NULL AND _partner.user_id <> _user_id THEN
    RAISE EXCEPTION 'Loja já vinculada a outro usuário';
  END IF;

  UPDATE public.partner_applications
    SET user_id = _user_id
    WHERE id = _partner.id
    RETURNING * INTO _partner;

  RETURN _partner;
END;
$function$;

-- 4. RLS for partners: owner can see/update own application
CREATE POLICY "Partners can read own application"
  ON public.partner_applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Partners can update own application"
  ON public.partner_applications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status = 'approved');

-- 5. RLS for products: owner partner can manage own products
CREATE POLICY "Partners can read own products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (partner_id = public.current_partner_id());

CREATE POLICY "Partners can insert own products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = public.current_partner_id());

CREATE POLICY "Partners can update own products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

CREATE POLICY "Partners can delete own products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (partner_id = public.current_partner_id());

-- 6. RLS for deliveries: owner partner can read own deliveries
CREATE POLICY "Partners can read own deliveries"
  ON public.deliveries
  FOR SELECT
  TO authenticated
  USING (partner_id = public.current_partner_id());