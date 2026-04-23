-- App versions
CREATE TABLE public.app_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  changelog TEXT NOT NULL DEFAULT '',
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read versions" ON public.app_versions FOR SELECT USING (true);
CREATE POLICY "Admins insert versions" ON public.app_versions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update versions" ON public.app_versions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete versions" ON public.app_versions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure only one current version
CREATE OR REPLACE FUNCTION public.ensure_single_current_version()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE public.app_versions SET is_current = false WHERE id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_current_version
  BEFORE INSERT OR UPDATE ON public.app_versions
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_current_version();

-- Home tiles
CREATE TABLE public.home_tiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  route TEXT NOT NULL,
  gradient TEXT NOT NULL DEFAULT 'gradient-primary',
  fg TEXT NOT NULL DEFAULT 'text-primary-foreground',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tiles" ON public.home_tiles FOR SELECT USING (true);
CREATE POLICY "Admins insert tiles" ON public.home_tiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update tiles" ON public.home_tiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete tiles" ON public.home_tiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_home_tiles_updated_at
  BEFORE UPDATE ON public.home_tiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial version
INSERT INTO public.app_versions (version, changelog, is_current) VALUES
  ('1.0', E'- Lançamento inicial\n- Sistema de lojas, entregas e portais\n- Painel admin completo', true);

-- Seed default home tiles
INSERT INTO public.home_tiles (label, emoji, icon, route, gradient, fg, display_order) VALUES
  ('Explorar lojas', '🛍️', 'ShoppingBag', '/lojas', 'gradient-primary', 'text-primary-foreground', 1),
  ('Buscar', '🔍', 'Search', '/buscar', 'gradient-secondary', 'text-secondary-foreground', 2),
  ('Descobrir', '🍽️', 'Compass', '/descobrir-hub', 'gradient-warm', 'text-primary-foreground', 3),
  ('Trabalhe com a gente', '🤝', 'Briefcase', '/trabalhe', 'bg-card border border-border', 'text-foreground', 4);