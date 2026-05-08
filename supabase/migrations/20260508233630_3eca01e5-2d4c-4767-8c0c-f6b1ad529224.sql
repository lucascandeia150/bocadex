-- Add pickup (retirada) fulfillment option
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery';

-- Validation trigger for fulfillment_type values
CREATE OR REPLACE FUNCTION public.validate_delivery_fulfillment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fulfillment_type NOT IN ('delivery','pickup') THEN
    RAISE EXCEPTION 'Invalid fulfillment_type: %', NEW.fulfillment_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_delivery_fulfillment ON public.deliveries;
CREATE TRIGGER trg_validate_delivery_fulfillment
  BEFORE INSERT OR UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.validate_delivery_fulfillment();

CREATE INDEX IF NOT EXISTS idx_deliveries_fulfillment ON public.deliveries(fulfillment_type);