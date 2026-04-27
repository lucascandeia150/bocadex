
-- 1) owner_name no cadastro de parceiros
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS owner_name text;

-- 2) Listar produtos do parceiro (inclui inativos)
CREATE OR REPLACE FUNCTION public.partner_list_products(_pin text)
RETURNS SETOF public.products
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pr.*
  FROM public.products pr
  JOIN public.partner_applications pa ON pa.id = pr.partner_id
  WHERE pa.access_pin = _pin
    AND pa.status = 'approved'
    AND pa.is_active = true
  ORDER BY pr.created_at DESC;
$$;

-- 3) Criar produto
CREATE OR REPLACE FUNCTION public.partner_create_product(
  _pin text,
  _name text,
  _description text,
  _price_min numeric,
  _price_max numeric,
  _image_url text,
  _category_id uuid
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _product public.products%ROWTYPE;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Nome do produto é obrigatório';
  END IF;

  INSERT INTO public.products (
    partner_id, name, description, price_min, price_max, image_url, category_id, is_active
  ) VALUES (
    _partner.id,
    trim(_name),
    COALESCE(_description, ''),
    _price_min,
    _price_max,
    _image_url,
    _category_id,
    true
  )
  RETURNING * INTO _product;

  RETURN _product;
END;
$$;

-- 4) Atualizar produto
CREATE OR REPLACE FUNCTION public.partner_update_product(
  _pin text,
  _product_id uuid,
  _name text,
  _description text,
  _price_min numeric,
  _price_max numeric,
  _image_url text,
  _category_id uuid,
  _is_active boolean
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _product public.products%ROWTYPE;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  UPDATE public.products
    SET name = COALESCE(NULLIF(trim(_name), ''), name),
        description = COALESCE(_description, description),
        price_min = _price_min,
        price_max = _price_max,
        image_url = _image_url,
        category_id = _category_id,
        is_active = COALESCE(_is_active, is_active),
        updated_at = now()
    WHERE id = _product_id AND partner_id = _partner.id
    RETURNING * INTO _product;

  IF _product.id IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  RETURN _product;
END;
$$;

-- 5) Toggle ativo/inativo (atalho)
CREATE OR REPLACE FUNCTION public.partner_toggle_product(_pin text, _product_id uuid)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _product public.products%ROWTYPE;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  UPDATE public.products
    SET is_active = NOT is_active, updated_at = now()
    WHERE id = _product_id AND partner_id = _partner.id
    RETURNING * INTO _product;

  IF _product.id IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  RETURN _product;
END;
$$;

-- 6) Excluir produto
CREATE OR REPLACE FUNCTION public.partner_delete_product(_pin text, _product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _affected int;
BEGIN
  SELECT * INTO _partner
  FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  DELETE FROM public.products
  WHERE id = _product_id AND partner_id = _partner.id;
  GET DIAGNOSTICS _affected = ROW_COUNT;

  IF _affected = 0 THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;
END;
$$;
