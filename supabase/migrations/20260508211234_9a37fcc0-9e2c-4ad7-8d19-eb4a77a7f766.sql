
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS delivery_lat numeric,
  ADD COLUMN IF NOT EXISTS delivery_lng numeric,
  ADD COLUMN IF NOT EXISTS courier_lat numeric,
  ADD COLUMN IF NOT EXISTS courier_lng numeric,
  ADD COLUMN IF NOT EXISTS courier_location_updated_at timestamptz;
