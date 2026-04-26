-- Garantir que mudanças em deliveries sejam transmitidas em tempo real com payload completo
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'deliveries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  END IF;
END $$;