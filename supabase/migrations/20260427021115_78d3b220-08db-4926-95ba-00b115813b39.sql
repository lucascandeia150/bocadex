-- Tabela de pagamentos (Mercado Pago)
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_reference text NOT NULL UNIQUE,
  mp_payment_id text,
  mp_preference_id text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 0,
  partner_id uuid REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  order_description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_external_reference ON public.payments(external_reference);
CREATE INDEX idx_payments_mp_payment_id ON public.payments(mp_payment_id);
CREATE INDEX idx_payments_partner_id ON public.payments(partner_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert payments"
  ON public.payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can read own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (partner_id = current_partner_id());

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Vincular delivery ao pagamento
ALTER TABLE public.deliveries
  ADD COLUMN payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_deliveries_payment_id_unique
  ON public.deliveries(payment_id)
  WHERE payment_id IS NOT NULL;