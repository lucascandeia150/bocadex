-- =========================================
-- 1) admin_audit_logs
-- =========================================
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT,
  actor_label TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX idx_admin_audit_logs_entity ON public.admin_audit_logs (entity_type, entity_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs (action);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Validate actor_type via trigger (no CHECK — keeps it flexible for future actor types)
CREATE OR REPLACE FUNCTION public.validate_audit_actor_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.actor_type NOT IN ('admin','partner','courier','customer','system','webhook') THEN
    RAISE EXCEPTION 'Invalid actor_type: %', NEW.actor_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_audit_actor_type
BEFORE INSERT OR UPDATE ON public.admin_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_audit_actor_type();

-- Policies
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Helper function to insert audit events (callable from other DB functions / edge functions via service role)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _actor_type TEXT,
  _actor_id TEXT,
  _actor_label TEXT,
  _action TEXT,
  _entity_type TEXT,
  _entity_id TEXT,
  _description TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.admin_audit_logs (
    actor_type, actor_id, actor_label, action, entity_type, entity_id, description, metadata
  ) VALUES (
    COALESCE(_actor_type, 'system'),
    _actor_id,
    _actor_label,
    _action,
    _entity_type,
    _entity_id,
    COALESCE(_description, ''),
    COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- =========================================
-- 2) app_settings
-- =========================================
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins insert settings"
  ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update settings"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete settings"
  ON public.app_settings
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger (uses existing public.update_updated_at_column)
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default flags
INSERT INTO public.app_settings (key, value, description) VALUES
  ('online_payment_enabled', 'true'::jsonb, 'Habilita pagamento online via Mercado Pago'),
  ('show_recipes', 'true'::jsonb, 'Exibe a seção de receitas no app'),
  ('show_videos', 'true'::jsonb, 'Exibe a seção de vídeos no app'),
  ('maintenance_mode', 'false'::jsonb, 'Modo de manutenção — bloqueia novos pedidos')
ON CONFLICT (key) DO NOTHING;