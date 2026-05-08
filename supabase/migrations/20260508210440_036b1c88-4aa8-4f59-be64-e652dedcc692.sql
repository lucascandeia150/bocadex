
-- 1. Slugify helper (lowercase, no accents, hyphens)
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF _input IS NULL THEN RETURN NULL; END IF;
  -- unaccent via translate (covers common PT-BR chars)
  s := lower(_input);
  s := translate(s,
    'áàâãäåāăąçćčďđéèêëēĕėęěğĝģíìîïĩīĭįıĵķĺľłñńňóòôõöøōŏőŕřśŝşšťţúùûüũūŭůűųŵýÿŷźžż',
    'aaaaaaaaacccddeeeeeeeeegggiiiiiiiiijkllnnnoooooooooorrsssstuuuuuuuuuuwyyyzzz');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  IF s = '' OR s IS NULL THEN s := 'loja'; END IF;
  RETURN s;
END;
$$;

-- 2. Add column
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS partner_applications_slug_unique
  ON public.partner_applications (slug)
  WHERE slug IS NOT NULL;

-- 3. Generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_partner_slug(_base text, _exclude_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := slugify(_base);
  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM partner_applications
    WHERE slug = candidate
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  ) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 4. Trigger: assign slug when missing or business_name changes and slug not set manually
CREATE OR REPLACE FUNCTION public.partner_applications_set_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    NEW.slug := generate_unique_partner_slug(NEW.business_name, NEW.id);
  ELSE
    -- normalize manually-provided slug, then ensure uniqueness
    NEW.slug := generate_unique_partner_slug(NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_partner_applications_set_slug ON public.partner_applications;
CREATE TRIGGER trg_partner_applications_set_slug
BEFORE INSERT OR UPDATE OF slug, business_name ON public.partner_applications
FOR EACH ROW EXECUTE FUNCTION public.partner_applications_set_slug();

-- 5. Backfill existing rows
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, business_name FROM partner_applications WHERE slug IS NULL ORDER BY created_at ASC LOOP
    UPDATE partner_applications SET slug = generate_unique_partner_slug(r.business_name, r.id) WHERE id = r.id;
  END LOOP;
END $$;

-- 6. Resolver RPC: accepts slug OR uuid, returns id + slug (for old links redirect)
CREATE OR REPLACE FUNCTION public.resolve_partner(_key text)
RETURNS TABLE(id uuid, slug text, business_name text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.slug, p.business_name
  FROM partner_applications p
  WHERE (p.slug = _key)
     OR (
       _key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       AND p.id = _key::uuid
     )
  LIMIT 1;
$$;
