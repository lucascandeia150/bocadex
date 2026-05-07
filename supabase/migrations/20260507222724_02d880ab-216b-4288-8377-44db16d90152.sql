-- Phase 2: Demo courier (idempotent)
INSERT INTO public.couriers (name, phone, vehicle, is_active)
SELECT 'Entregador Demo', '00000000000', 'moto', true
WHERE NOT EXISTS (SELECT 1 FROM public.couriers WHERE name = 'Entregador Demo');

-- Phase 3: Admin manual partner creation RPC
CREATE OR REPLACE FUNCTION public.admin_create_partner(
  _business_name text,
  _business_type text,
  _owner_name text,
  _whatsapp text,
  _address text,
  _description text DEFAULT '',
  _logo_url text DEFAULT NULL,
  _uses_app_courier boolean DEFAULT false,
  _is_featured boolean DEFAULT false,
  _promotions text DEFAULT NULL,
  _plan text DEFAULT 'monthly_990'
) RETURNS public.partner_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _p public.partner_applications%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF _business_name IS NULL OR length(trim(_business_name)) = 0 THEN
    RAISE EXCEPTION 'Nome da loja é obrigatório';
  END IF;
  IF _whatsapp IS NULL OR length(trim(_whatsapp)) = 0 THEN
    RAISE EXCEPTION 'WhatsApp é obrigatório';
  END IF;
  IF _address IS NULL OR length(trim(_address)) = 0 THEN
    RAISE EXCEPTION 'Endereço é obrigatório';
  END IF;

  INSERT INTO public.partner_applications (
    business_name, business_type, description, address, whatsapp,
    logo_url, owner_name, uses_app_courier, is_featured, promotions,
    status, is_active, visibility, payment_status, plan,
    subscription_active_until, last_payment_at, created_by
  ) VALUES (
    trim(_business_name),
    COALESCE(_business_type, 'Outros'),
    COALESCE(_description, ''),
    trim(_address),
    trim(_whatsapp),
    _logo_url,
    _owner_name,
    COALESCE(_uses_app_courier, false),
    COALESCE(_is_featured, false),
    _promotions,
    'approved',
    true,
    'public',
    'paid',
    COALESCE(_plan, 'monthly_990'),
    now() + interval '30 days',
    now(),
    auth.uid()
  )
  RETURNING * INTO _p;

  RETURN _p;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_partner(text,text,text,text,text,text,text,boolean,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_partner(text,text,text,text,text,text,text,boolean,boolean,text,text) TO authenticated;