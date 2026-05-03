-- 1. Schema additions
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partner_apps_is_demo ON public.partner_applications(is_demo);
CREATE INDEX IF NOT EXISTS idx_deliveries_is_demo ON public.deliveries(is_demo);

-- 2. Update public read policy to hide demo / admin_only
DROP POLICY IF EXISTS "Anyone can read active approved partners" ON public.partner_applications;
CREATE POLICY "Public can read public approved partners"
  ON public.partner_applications FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    AND is_active = true
    AND visibility = 'public'
    AND is_demo = false
  );

-- Hide demo products from public listings
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active non-demo products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_demo = false);

-- 3. Trigger to auto-mark child rows as demo from their partner
CREATE OR REPLACE FUNCTION public.mark_demo_from_partner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _flag boolean;
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    SELECT is_demo INTO _flag FROM public.partner_applications WHERE id = NEW.partner_id;
    NEW.is_demo := COALESCE(_flag, false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_demo_deliveries ON public.deliveries;
CREATE TRIGGER trg_mark_demo_deliveries
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.mark_demo_from_partner();

DROP TRIGGER IF EXISTS trg_mark_demo_products ON public.products;
CREATE TRIGGER trg_mark_demo_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.mark_demo_from_partner();

-- 4. Reset function (admin only)
CREATE OR REPLACE FUNCTION public.reset_demo_store()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _demo_id uuid;
  _del_orders int := 0;
  _del_products int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT id INTO _demo_id FROM public.partner_applications
    WHERE is_demo = true ORDER BY created_at ASC LIMIT 1;

  IF _demo_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Loja demo não encontrada');
  END IF;

  WITH d AS (DELETE FROM public.deliveries WHERE partner_id = _demo_id RETURNING 1)
    SELECT count(*) INTO _del_orders FROM d;
  WITH p AS (DELETE FROM public.products WHERE partner_id = _demo_id RETURNING 1)
    SELECT count(*) INTO _del_products FROM p;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_orders', _del_orders,
    'deleted_products', _del_products
  );
END;
$$;

-- 5. Seed Loja Demo
INSERT INTO public.partner_applications (
  business_name, business_type, address, description, whatsapp,
  status, is_active, is_open, uses_app_courier, is_demo, visibility, access_pin
)
SELECT
  'Loja Demo (Apresentação)',
  'Restaurante',
  'Endereço de demonstração — uso interno',
  'Loja de demonstração para apresentações presenciais. Não impacta dados reais.',
  '5533998669482',
  'approved', true, true, false,
  true, 'admin_only', '000000'
WHERE NOT EXISTS (SELECT 1 FROM public.partner_applications WHERE is_demo = true);