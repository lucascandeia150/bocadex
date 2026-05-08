DROP FUNCTION IF EXISTS public.courier_list_deliveries(text);

CREATE OR REPLACE FUNCTION public.courier_list_deliveries(_pin text)
 RETURNS TABLE(id uuid, partner_id uuid, partner_name text, order_description text, delivery_address text, notes text, fee numeric, status text, courier_id uuid, partner_whatsapp text, created_at timestamp with time zone, delivery_code text, customer_name text, customer_phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    d.id, d.partner_id, d.partner_name, d.order_description, d.delivery_address,
    d.notes, d.fee, d.status, d.courier_id,
    p.whatsapp AS partner_whatsapp, d.created_at,
    CASE WHEN d.courier_id = c.id THEN d.delivery_code ELSE NULL END AS delivery_code,
    CASE WHEN d.courier_id = c.id THEN pay.customer_name ELSE NULL END AS customer_name,
    CASE WHEN d.courier_id = c.id THEN pay.customer_phone ELSE NULL END AS customer_phone
  FROM public.deliveries d
  LEFT JOIN public.partner_applications p ON p.id = d.partner_id
  LEFT JOIN public.payments pay ON pay.id = d.payment_id
  JOIN public.couriers c ON c.access_pin = _pin AND c.is_active = true
  WHERE (d.status = 'disponivel' AND d.prep_status = 'ready')
     OR (d.courier_id = c.id AND d.status IN ('aceita','em_andamento'))
  ORDER BY d.created_at DESC;
$function$;