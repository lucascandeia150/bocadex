
-- 1) Hide access_pin from public reads on partner_applications
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon, authenticated, public;

-- 2) Drop the broad realtime subscription policy that allowed any authenticated user to subscribe to all channels
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;

-- 3) Also drop any stale duplicate on public.messages if present
DROP POLICY IF EXISTS "Authenticated can read realtime" ON public.messages;
