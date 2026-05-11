
CREATE TABLE IF NOT EXISTS public.store_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_promotions_partner ON public.store_promotions(partner_id);
CREATE INDEX IF NOT EXISTS idx_store_promotions_active ON public.store_promotions(is_active);

ALTER TABLE public.store_promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active promotions" ON public.store_promotions;
CREATE POLICY "Anyone can read active promotions"
  ON public.store_promotions FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Partners manage own promotions" ON public.store_promotions;
CREATE POLICY "Partners manage own promotions"
  ON public.store_promotions FOR ALL
  TO authenticated
  USING (partner_id = public.current_partner_id())
  WITH CHECK (partner_id = public.current_partner_id());

DROP POLICY IF EXISTS "Admins manage promotions" ON public.store_promotions;
CREATE POLICY "Admins manage promotions"
  ON public.store_promotions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER store_promotions_updated_at
  BEFORE UPDATE ON public.store_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
