-- Tabela de candidaturas de entregadores
CREATE TABLE public.courier_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city_neighborhood TEXT NOT NULL,
  transport_type TEXT NOT NULL,
  availability TEXT NOT NULL,
  has_experience BOOLEAN NOT NULL DEFAULT false,
  service_area TEXT NOT NULL,
  average_fee NUMERIC,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_applications ENABLE ROW LEVEL SECURITY;

-- Validação de status
CREATE OR REPLACE FUNCTION public.validate_courier_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pendente', 'aprovado', 'recusado') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_courier_application_status_trigger
BEFORE INSERT OR UPDATE ON public.courier_applications
FOR EACH ROW EXECUTE FUNCTION public.validate_courier_application_status();

CREATE TRIGGER update_courier_applications_updated_at
BEFORE UPDATE ON public.courier_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Qualquer um pode se candidatar
CREATE POLICY "Anyone can submit courier application"
ON public.courier_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Apenas admin pode ler
CREATE POLICY "Admins can read courier applications"
ON public.courier_applications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admin pode atualizar
CREATE POLICY "Admins can update courier applications"
ON public.courier_applications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admin pode remover
CREATE POLICY "Admins can delete courier applications"
ON public.courier_applications FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar flag em parceiros: usa entregador do app?
ALTER TABLE public.partner_applications
ADD COLUMN IF NOT EXISTS uses_app_courier BOOLEAN NOT NULL DEFAULT false;