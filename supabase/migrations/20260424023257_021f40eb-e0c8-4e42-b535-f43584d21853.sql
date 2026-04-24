
-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL UNIQUE,
  courier_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ratings_courier ON public.ratings(courier_id);
CREATE INDEX IF NOT EXISTS idx_ratings_delivery ON public.ratings(delivery_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Leitura pública (para mostrar média no perfil)
CREATE POLICY "Anyone can read ratings"
  ON public.ratings FOR SELECT
  USING (true);

-- Admins gerenciam
CREATE POLICY "Admins manage ratings"
  ON public.ratings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função: loja avalia entregador via PIN
CREATE OR REPLACE FUNCTION public.partner_rate_courier(
  _pin text,
  _delivery_id uuid,
  _stars integer,
  _comment text DEFAULT ''
)
RETURNS public.ratings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner public.partner_applications%ROWTYPE;
  _delivery public.deliveries%ROWTYPE;
  _rating public.ratings%ROWTYPE;
BEGIN
  IF _stars < 1 OR _stars > 5 THEN
    RAISE EXCEPTION 'Estrelas devem estar entre 1 e 5';
  END IF;

  SELECT * INTO _partner FROM public.partner_applications
  WHERE access_pin = _pin AND status = 'approved' AND is_active = true
  LIMIT 1;

  IF _partner.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  SELECT * INTO _delivery FROM public.deliveries
  WHERE id = _delivery_id AND partner_id = _partner.id AND status = 'concluida'
  LIMIT 1;

  IF _delivery.id IS NULL THEN
    RAISE EXCEPTION 'Entrega não encontrada ou não concluída';
  END IF;

  IF _delivery.courier_id IS NULL THEN
    RAISE EXCEPTION 'Entrega sem entregador';
  END IF;

  INSERT INTO public.ratings (delivery_id, courier_id, partner_id, stars, comment)
  VALUES (_delivery_id, _delivery.courier_id, _partner.id, _stars, COALESCE(_comment, ''))
  ON CONFLICT (delivery_id) DO UPDATE
    SET stars = EXCLUDED.stars, comment = EXCLUDED.comment
  RETURNING * INTO _rating;

  RETURN _rating;
END;
$$;

-- Função: estatísticas do entregador
CREATE OR REPLACE FUNCTION public.courier_rating_stats(_courier_id uuid)
RETURNS TABLE(avg_stars numeric, total_ratings bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(stars)::numeric, 1), 0) AS avg_stars,
         COUNT(*) AS total_ratings
  FROM public.ratings
  WHERE courier_id = _courier_id;
$$;

-- Habilita realtime
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.ratings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'deliveries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'ratings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
  END IF;
END $$;
