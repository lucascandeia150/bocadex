-- 1) Campos de assinatura em partner_applications
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS subscription_active_until timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'monthly_990';

-- 2) Tipo na tabela payments para distinguir pedido vs assinatura
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'customer_order';

-- 3) Função: ativar parceiro após pagamento aprovado da assinatura
CREATE OR REPLACE FUNCTION public.activate_partner_subscription(_partner_id uuid, _payment_id uuid)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _p public.partner_applications%ROWTYPE;
BEGIN
  UPDATE public.partner_applications
    SET status = 'approved',
        is_active = true,
        visibility = 'public',
        is_demo = false,
        payment_status = 'paid',
        last_payment_at = now(),
        subscription_active_until = GREATEST(COALESCE(subscription_active_until, now()), now()) + interval '30 days'
    WHERE id = _partner_id
    RETURNING * INTO _p;

  IF _p.id IS NULL THEN
    RAISE EXCEPTION 'Parceiro não encontrado: %', _partner_id;
  END IF;

  RETURN _p;
END;
$$;

-- 4) Função: criar candidatura inicial (pode ser anônimo)
CREATE OR REPLACE FUNCTION public.submit_partner_application(
  _business_name text,
  _business_type text,
  _description text,
  _address text,
  _whatsapp text,
  _logo_url text,
  _owner_name text,
  _uses_app_courier boolean
)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _p public.partner_applications%ROWTYPE;
  _uid uuid := auth.uid();
BEGIN
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
    logo_url, owner_name, uses_app_courier,
    status, is_active, visibility, payment_status, plan, user_id
  ) VALUES (
    trim(_business_name),
    COALESCE(_business_type, 'Outros'),
    COALESCE(_description, ''),
    trim(_address),
    trim(_whatsapp),
    _logo_url,
    _owner_name,
    COALESCE(_uses_app_courier, false),
    'pending',
    false,
    'private',
    'pending_payment',
    'monthly_990',
    _uid
  )
  RETURNING * INTO _p;

  RETURN _p;
END;
$$;

-- 5) Permitir execução das funções
GRANT EXECUTE ON FUNCTION public.submit_partner_application(text,text,text,text,text,text,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_partner_subscription(uuid,uuid) TO authenticated;