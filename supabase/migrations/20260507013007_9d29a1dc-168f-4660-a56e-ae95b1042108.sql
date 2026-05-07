
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  topic_tags text[] NOT NULL DEFAULT '{}',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert token"
  ON public.device_tokens FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users read own tokens"
  ON public.device_tokens FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own tokens"
  ON public.device_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (true);

CREATE POLICY "Users delete own tokens"
  ON public.device_tokens FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all tokens"
  ON public.device_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tokens"
  ON public.device_tokens FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.push_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  target text NOT NULL DEFAULT 'all',
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read push logs"
  ON public.push_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.register_device_token(
  _token text, _platform text DEFAULT 'web', _user_agent text DEFAULT NULL
) RETURNS public.device_tokens
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.device_tokens%ROWTYPE;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;
  INSERT INTO public.device_tokens (user_id, token, platform, user_agent, last_seen_at)
  VALUES (_uid, _token, COALESCE(_platform,'web'), _user_agent, now())
  ON CONFLICT (token) DO UPDATE
    SET user_id = COALESCE(EXCLUDED.user_id, public.device_tokens.user_id),
        platform = EXCLUDED.platform,
        user_agent = COALESCE(EXCLUDED.user_agent, public.device_tokens.user_agent),
        last_seen_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END;
$$;
