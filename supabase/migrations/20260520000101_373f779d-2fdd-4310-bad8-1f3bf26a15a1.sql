
-- device_tokens: prevent hijacking
DROP POLICY IF EXISTS "Anyone can insert token" ON public.device_tokens;
DROP POLICY IF EXISTS "Users update own tokens" ON public.device_tokens;

CREATE POLICY "Anon can insert anonymous token"
  ON public.device_tokens FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Authenticated can insert own token"
  ON public.device_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users update own tokens"
  ON public.device_tokens FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

-- payments: prevent fake record injection
DROP POLICY IF EXISTS "Authenticated can insert payments" ON public.payments;

CREATE POLICY "Users insert own pending payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND status = 'pending'
    AND (metadata->>'user_id') = (auth.uid())::text
  );

-- messages: drop overly permissive realtime read
DROP POLICY IF EXISTS "Authenticated can read realtime" ON public.messages;
