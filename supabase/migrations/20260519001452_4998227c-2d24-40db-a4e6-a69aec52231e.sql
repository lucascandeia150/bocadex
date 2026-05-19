
CREATE OR REPLACE FUNCTION public.admin_courier_pins(_courier_ids uuid[])
RETURNS TABLE(id uuid, access_pin text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT c.id, c.access_pin FROM public.couriers c
  WHERE c.id = ANY(_courier_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_all_courier_pins_by_application()
RETURNS TABLE(application_id uuid, access_pin text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT c.application_id, c.access_pin FROM public.couriers c
  WHERE c.application_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_courier_pins(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_all_courier_pins_by_application() TO authenticated;
