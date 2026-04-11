
-- Create partner applications table
CREATE TABLE public.partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  promotions TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert partner applications"
ON public.partner_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read partner applications"
ON public.partner_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner applications"
ON public.partner_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete partner applications"
ON public.partner_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for partner images
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-images', 'partner-images', true);

CREATE POLICY "Anyone can upload partner images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'partner-images');

CREATE POLICY "Anyone can view partner images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'partner-images');

CREATE POLICY "Admins can delete partner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'partner-images');
