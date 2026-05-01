-- Tabela de endereços do cliente
CREATE TABLE public.user_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Casa',
  address text NOT NULL,
  reference text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own addresses" ON public.user_addresses
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own addresses" ON public.user_addresses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own addresses" ON public.user_addresses
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own addresses" ON public.user_addresses
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);

-- Garante apenas 1 endereço padrão por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.user_addresses
      SET is_default = false
      WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.user_addresses
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();

-- Tabela de favoritos
CREATE TABLE public.user_favorite_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_id)
);

ALTER TABLE public.user_favorite_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own favorites" ON public.user_favorite_partners
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own favorites" ON public.user_favorite_partners
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own favorites" ON public.user_favorite_partners
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_user_fav_partners_user ON public.user_favorite_partners(user_id);