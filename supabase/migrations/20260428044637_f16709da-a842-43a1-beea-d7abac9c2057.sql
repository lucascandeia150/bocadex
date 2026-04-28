-- Bloquear cadastro duplicado de parceiros pelo mesmo nome (case-insensitive) + WhatsApp
CREATE UNIQUE INDEX IF NOT EXISTS partner_applications_unique_name_whatsapp
  ON public.partner_applications (lower(business_name), whatsapp);