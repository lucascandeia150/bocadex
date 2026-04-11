
-- 1. Fix storage DELETE policy: add admin role check
DROP POLICY IF EXISTS "Admins can delete partner images" ON storage.objects;
CREATE POLICY "Admins can delete partner images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-images'
  AND public.has_role(auth.uid(), 'admin')
);

-- 2. Fix storage INSERT policy: require authentication
DROP POLICY IF EXISTS "Anyone can upload partner images" ON storage.objects;
CREATE POLICY "Authenticated users can upload partner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'partner-images');

-- 3. Add analytics event_type validation trigger
CREATE OR REPLACE FUNCTION public.validate_analytics_event_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN (
    'page_view', 'click', 'form_submit',
    'suggestion_generated', 'partner_click', 'whatsapp_click',
    'buy_ingredients_click', 'buy_ingredient_click',
    'recipe_video_click', 'more_options_click'
  ) THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_analytics_event_type
BEFORE INSERT ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.validate_analytics_event_type();

-- 4. Add explicit admin-only INSERT/UPDATE policies on user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
