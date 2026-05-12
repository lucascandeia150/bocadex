
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text;

CREATE OR REPLACE FUNCTION public.partner_update_store_v2(
  _pin text,
  _business_name text,
  _description text,
  _address text,
  _whatsapp text,
  _logo_url text,
  _is_open boolean,
  _banner_url text DEFAULT NULL,
  _opening_hours jsonb DEFAULT NULL,
  _instagram_url text DEFAULT NULL,
  _facebook_url text DEFAULT NULL
)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.partner_applications;
BEGIN
  UPDATE public.partner_applications
     SET business_name = COALESCE(_business_name, business_name),
         description   = COALESCE(_description, description),
         address       = COALESCE(_address, address),
         whatsapp      = COALESCE(_whatsapp, whatsapp),
         logo_url      = COALESCE(_logo_url, logo_url),
         is_open       = COALESCE(_is_open, is_open),
         banner_url    = COALESCE(_banner_url, banner_url),
         opening_hours = COALESCE(_opening_hours, opening_hours),
         instagram_url = COALESCE(_instagram_url, instagram_url),
         facebook_url  = COALESCE(_facebook_url, facebook_url)
   WHERE access_pin = _pin
   RETURNING * INTO _row;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_update_store_v2(text, text, text, text, text, text, boolean, text, jsonb, text, text) TO anon, authenticated;
