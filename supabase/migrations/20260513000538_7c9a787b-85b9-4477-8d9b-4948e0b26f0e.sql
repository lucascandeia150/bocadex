
-- Categorias por loja + campos de destaque/promo/ordem em produtos
-- ============================================================

-- 1) Tabela partner_categories
CREATE TABLE IF NOT EXISTS public.partner_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🍽️',
  image_url text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_categories_partner ON public.partner_categories(partner_id, display_order);

ALTER TABLE public.partner_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active partner categories" ON public.partner_categories;
CREATE POLICY "Anyone can read active partner categories"
  ON public.partner_categories FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Partners manage own categories" ON public.partner_categories;
CREATE POLICY "Partners manage own categories"
  ON public.partner_categories FOR ALL TO authenticated
  USING (partner_id = current_partner_id())
  WITH CHECK (partner_id = current_partner_id());

DROP POLICY IF EXISTS "Admins manage partner categories" ON public.partner_categories;
CREATE POLICY "Admins manage partner categories"
  ON public.partner_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER trg_partner_categories_updated_at
  BEFORE UPDATE ON public.partner_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Novas colunas em products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS partner_category_id uuid,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_partner_category ON public.products(partner_category_id);
CREATE INDEX IF NOT EXISTS idx_products_partner_featured ON public.products(partner_id, is_featured);

-- 3) RPCs categorias
CREATE OR REPLACE FUNCTION public.partner_list_categories(_pin text)
RETURNS SETOF public.partner_categories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pc.*
  FROM public.partner_categories pc
  JOIN public.partner_applications pa ON pa.id = pc.partner_id
  WHERE pa.access_pin = _pin AND pa.status = 'approved' AND pa.is_active = true
  ORDER BY pc.display_order, pc.created_at;
$$;

CREATE OR REPLACE FUNCTION public.partner_create_category(
  _pin text, _name text, _icon text, _image_url text
)
RETURNS public.partner_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE; _row public.partner_categories%ROWTYPE; _next int;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;

  SELECT COALESCE(MAX(display_order), -1) + 1 INTO _next
    FROM public.partner_categories WHERE partner_id = _partner.id;

  INSERT INTO public.partner_categories (partner_id, name, icon, image_url, display_order)
  VALUES (_partner.id, trim(_name), COALESCE(NULLIF(trim(_icon), ''), '🍽️'), _image_url, _next)
  RETURNING * INTO _row;
  RETURN _row;
END; $$;

CREATE OR REPLACE FUNCTION public.partner_update_category(
  _pin text, _id uuid, _name text, _icon text, _image_url text,
  _display_order int, _is_active boolean
)
RETURNS public.partner_categories
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE; _row public.partner_categories%ROWTYPE;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  UPDATE public.partner_categories SET
    name = COALESCE(NULLIF(trim(_name), ''), name),
    icon = COALESCE(NULLIF(trim(_icon), ''), icon),
    image_url = _image_url,
    display_order = COALESCE(_display_order, display_order),
    is_active = COALESCE(_is_active, is_active),
    updated_at = now()
  WHERE id = _id AND partner_id = _partner.id
  RETURNING * INTO _row;
  IF _row.id IS NULL THEN RAISE EXCEPTION 'Categoria não encontrada'; END IF;
  RETURN _row;
END; $$;

CREATE OR REPLACE FUNCTION public.partner_delete_category(_pin text, _id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE; _affected int;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  UPDATE public.products SET partner_category_id = NULL
    WHERE partner_category_id = _id AND partner_id = _partner.id;

  DELETE FROM public.partner_categories WHERE id = _id AND partner_id = _partner.id;
  GET DIAGNOSTICS _affected = ROW_COUNT;
  IF _affected = 0 THEN RAISE EXCEPTION 'Categoria não encontrada'; END IF;
END; $$;

-- 4) Substituir RPCs de produto para aceitar novos campos
DROP FUNCTION IF EXISTS public.partner_create_product(text, text, text, numeric, numeric, text, uuid);
CREATE OR REPLACE FUNCTION public.partner_create_product(
  _pin text, _name text, _description text,
  _price_min numeric, _price_max numeric, _image_url text,
  _category_id uuid, _partner_category_id uuid DEFAULT NULL,
  _is_featured boolean DEFAULT false, _original_price numeric DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE; _product public.products%ROWTYPE; _next int;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  IF _name IS NULL OR length(trim(_name)) = 0 THEN RAISE EXCEPTION 'Nome do produto é obrigatório'; END IF;

  SELECT COALESCE(MAX(display_order), -1) + 1 INTO _next
    FROM public.products WHERE partner_id = _partner.id;

  INSERT INTO public.products (
    partner_id, name, description, price_min, price_max, image_url,
    category_id, partner_category_id, is_featured, original_price, display_order, is_active
  ) VALUES (
    _partner.id, trim(_name), COALESCE(_description, ''),
    _price_min, _price_max, _image_url,
    _category_id, _partner_category_id, COALESCE(_is_featured, false),
    _original_price, _next, true
  )
  RETURNING * INTO _product;
  RETURN _product;
END; $$;

DROP FUNCTION IF EXISTS public.partner_update_product(text, uuid, text, text, numeric, numeric, text, uuid, boolean);
CREATE OR REPLACE FUNCTION public.partner_update_product(
  _pin text, _product_id uuid, _name text, _description text,
  _price_min numeric, _price_max numeric, _image_url text,
  _category_id uuid, _is_active boolean,
  _partner_category_id uuid DEFAULT NULL,
  _is_featured boolean DEFAULT NULL,
  _original_price numeric DEFAULT NULL,
  _clear_original_price boolean DEFAULT false
)
RETURNS public.products
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE; _product public.products%ROWTYPE;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;

  UPDATE public.products SET
    name = COALESCE(NULLIF(trim(_name), ''), name),
    description = COALESCE(_description, description),
    price_min = _price_min,
    price_max = _price_max,
    image_url = _image_url,
    category_id = _category_id,
    partner_category_id = _partner_category_id,
    is_featured = COALESCE(_is_featured, is_featured),
    original_price = CASE WHEN _clear_original_price THEN NULL ELSE COALESCE(_original_price, original_price) END,
    is_active = COALESCE(_is_active, is_active),
    updated_at = now()
  WHERE id = _product_id AND partner_id = _partner.id
  RETURNING * INTO _product;
  IF _product.id IS NULL THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
  RETURN _product;
END; $$;

-- 5) Reordenar produto (mover ↑↓)
CREATE OR REPLACE FUNCTION public.partner_set_product_order(_pin text, _product_id uuid, _order int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _partner public.partner_applications%ROWTYPE;
BEGIN
  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _partner.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  UPDATE public.products SET display_order = _order, updated_at = now()
    WHERE id = _product_id AND partner_id = _partner.id;
END; $$;
