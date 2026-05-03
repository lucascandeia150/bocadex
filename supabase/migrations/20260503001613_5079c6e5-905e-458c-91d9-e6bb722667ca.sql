DROP FUNCTION IF EXISTS public.partner_login(text);

CREATE OR REPLACE FUNCTION public.partner_login(_pin text)
 RETURNS TABLE(id uuid, business_name text, address text, whatsapp text, description text, logo_url text, is_open boolean, uses_app_courier boolean, is_demo boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, business_name, address, whatsapp, description, logo_url, is_open, uses_app_courier, is_demo
  FROM public.partner_applications
  WHERE access_pin = _pin
    AND status = 'approved'
    AND is_active = true
  LIMIT 1;
$function$;