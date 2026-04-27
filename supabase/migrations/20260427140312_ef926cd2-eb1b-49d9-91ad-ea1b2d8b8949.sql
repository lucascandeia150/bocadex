
-- 1) Tighten partner_applications INSERT policy: enforce user_id matches auth or is NULL
DROP POLICY IF EXISTS "Anyone can insert partner applications" ON public.partner_applications;

CREATE POLICY "Anyone can insert partner applications"
ON public.partner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL
  OR user_id = auth.uid()
);

-- 2) Realtime channel authorization: restrict realtime.messages access.
-- postgres_changes events still flow through WAL and respect table-level RLS,
-- but broadcast/presence channel access is now scoped to admins only.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read realtime messages" ON realtime.messages;
CREATE POLICY "Admins can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can write realtime messages" ON realtime.messages;
CREATE POLICY "Admins can write realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
