-- Add logo_url and is_active columns to partner_applications
ALTER TABLE public.partner_applications 
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Allow public to read approved and active partners (for app display)
CREATE POLICY "Anyone can read active approved partners"
ON public.partner_applications
FOR SELECT
TO anon
USING (status = 'approved' AND is_active = true);