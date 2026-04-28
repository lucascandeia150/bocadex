
-- 1) Restrict anonymous read of access_pin on partner_applications via column-level privileges.
-- RLS still permits row reads, but anon (and authenticated non-admin) cannot select the access_pin column.
REVOKE SELECT (access_pin) ON public.partner_applications FROM anon;
REVOKE SELECT (access_pin) ON public.partner_applications FROM authenticated;

-- Re-grant SELECT on all other (non-sensitive) columns so existing public reads keep working.
GRANT SELECT (
  id, user_id, business_name, business_type, address, description, whatsapp,
  promotions, images, status, created_at, logo_url, is_active, uses_app_courier,
  is_featured, owner_name, is_open
) ON public.partner_applications TO anon, authenticated;

-- 2) Tighten admin_audit_logs INSERT policy to prevent log forgery.
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.admin_audit_logs;

-- Authenticated users may only insert log rows that represent themselves
-- (actor_id matches their uid, and actor_type restricted to non-privileged values).
-- Privileged log writes (admin/system/webhook) must go through SECURITY DEFINER
-- function log_audit_event or the service role, which bypass RLS.
CREATE POLICY "Authenticated users can insert own audit entries"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  actor_type IN ('customer', 'partner', 'courier')
  AND actor_id = auth.uid()::text
);
