
-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  last_message_at timestamptz,
  last_message_preview text,
  customer_unread int NOT NULL DEFAULT 0,
  partner_unread int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chats_partner_idx ON public.chats(partner_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS chats_customer_idx ON public.chats(customer_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_id uuid,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_chat_idx ON public.messages(chat_id, created_at);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Validation
CREATE OR REPLACE FUNCTION public.validate_message_sender_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sender_type NOT IN ('customer','partner','admin') THEN
    RAISE EXCEPTION 'Invalid sender_type: %', NEW.sender_type;
  END IF;
  IF length(NEW.content) = 0 OR length(NEW.content) > 1000 THEN
    RAISE EXCEPTION 'Mensagem deve ter entre 1 e 1000 caracteres';
  END IF;
  -- strip basic html tags
  NEW.content := regexp_replace(NEW.content, '<[^>]*>', '', 'g');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_message_sender_type ON public.messages;
CREATE TRIGGER validate_message_sender_type BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.validate_message_sender_type();

-- ============ RLS ============
-- Customers can read their own chats; partners read own; admins all
CREATE POLICY "Customers read own chats" ON public.chats FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
CREATE POLICY "Partners read own chats via current_partner" ON public.chats FOR SELECT TO authenticated
  USING (partner_id = current_partner_id());
CREATE POLICY "Admins manage chats" ON public.chats FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Customers read own messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND c.customer_id = auth.uid()));
CREATE POLICY "Partners read own messages via current_partner" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chats c WHERE c.id = chat_id AND c.partner_id = current_partner_id()));
CREATE POLICY "Admins manage messages" ON public.messages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- ============ FUNCTIONS ============
-- Customer: get or create chat for an order they own
CREATE OR REPLACE FUNCTION public.customer_get_or_create_chat(_order_id uuid)
RETURNS chats LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _d public.deliveries%ROWTYPE;
  _c public.chats%ROWTYPE;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login obrigatório'; END IF;
  SELECT * INTO _d FROM public.deliveries WHERE id = _order_id AND user_id = _uid LIMIT 1;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF _d.partner_id IS NULL THEN RAISE EXCEPTION 'Pedido sem loja vinculada'; END IF;

  SELECT * INTO _c FROM public.chats WHERE order_id = _order_id LIMIT 1;
  IF _c.id IS NULL THEN
    INSERT INTO public.chats (order_id, customer_id, partner_id)
    VALUES (_order_id, _uid, _d.partner_id)
    RETURNING * INTO _c;
  END IF;
  RETURN _c;
END;
$$;

-- Customer: send message
CREATE OR REPLACE FUNCTION public.customer_send_message(_chat_id uuid, _content text)
RETURNS messages LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _c public.chats%ROWTYPE;
  _m public.messages%ROWTYPE;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login obrigatório'; END IF;
  SELECT * INTO _c FROM public.chats WHERE id = _chat_id AND customer_id = _uid LIMIT 1;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Chat não encontrado'; END IF;

  INSERT INTO public.messages (chat_id, sender_type, sender_id, content)
  VALUES (_chat_id, 'customer', _uid, _content)
  RETURNING * INTO _m;

  UPDATE public.chats SET
    last_message_at = now(), updated_at = now(),
    last_message_preview = left(_m.content, 120),
    partner_unread = partner_unread + 1,
    customer_unread = 0
  WHERE id = _chat_id;
  RETURN _m;
END;
$$;

-- Customer: list messages
CREATE OR REPLACE FUNCTION public.customer_list_messages(_chat_id uuid)
RETURNS SETOF messages LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.* FROM public.messages m
  JOIN public.chats c ON c.id = m.chat_id
  WHERE m.chat_id = _chat_id AND c.customer_id = auth.uid()
  ORDER BY m.created_at ASC;
$$;

-- Customer: mark read
CREATE OR REPLACE FUNCTION public.customer_mark_chat_read(_chat_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chats SET customer_unread = 0, updated_at = now()
    WHERE id = _chat_id AND customer_id = auth.uid();
  UPDATE public.messages SET read = true
    WHERE chat_id = _chat_id AND sender_type = 'partner' AND read = false;
END;
$$;

-- Partner: list chats by PIN
CREATE OR REPLACE FUNCTION public.partner_list_chats(_pin text)
RETURNS TABLE(
  id uuid, order_id uuid, customer_id uuid, customer_name text,
  last_message_preview text, last_message_at timestamptz, partner_unread int,
  order_description text, order_status text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.order_id, c.customer_id,
         COALESCE(p.name, 'Cliente') AS customer_name,
         c.last_message_preview, c.last_message_at, c.partner_unread,
         d.order_description, d.status AS order_status
  FROM public.chats c
  JOIN public.partner_applications pa ON pa.id = c.partner_id
  LEFT JOIN public.deliveries d ON d.id = c.order_id
  LEFT JOIN public.profiles p ON p.id = c.customer_id
  WHERE pa.access_pin = _pin AND pa.status = 'approved' AND pa.is_active = true
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC;
$$;

-- Partner: list messages
CREATE OR REPLACE FUNCTION public.partner_list_messages(_pin text, _chat_id uuid)
RETURNS SETOF messages LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.* FROM public.messages m
  JOIN public.chats c ON c.id = m.chat_id
  JOIN public.partner_applications pa ON pa.id = c.partner_id
  WHERE m.chat_id = _chat_id AND pa.access_pin = _pin
    AND pa.status = 'approved' AND pa.is_active = true
  ORDER BY m.created_at ASC;
$$;

-- Partner: send message
CREATE OR REPLACE FUNCTION public.partner_send_message(_pin text, _chat_id uuid, _content text)
RETURNS messages LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pa public.partner_applications%ROWTYPE;
  _c public.chats%ROWTYPE;
  _m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO _pa FROM public.partner_applications
    WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _pa.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  SELECT * INTO _c FROM public.chats WHERE id = _chat_id AND partner_id = _pa.id LIMIT 1;
  IF _c.id IS NULL THEN RAISE EXCEPTION 'Chat não encontrado'; END IF;

  INSERT INTO public.messages (chat_id, sender_type, sender_id, content)
  VALUES (_chat_id, 'partner', _pa.id, _content)
  RETURNING * INTO _m;

  UPDATE public.chats SET
    last_message_at = now(), updated_at = now(),
    last_message_preview = left(_m.content, 120),
    customer_unread = customer_unread + 1,
    partner_unread = 0
  WHERE id = _chat_id;
  RETURN _m;
END;
$$;

-- Partner: mark read
CREATE OR REPLACE FUNCTION public.partner_mark_chat_read(_pin text, _chat_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pa public.partner_applications%ROWTYPE;
BEGIN
  SELECT * INTO _pa FROM public.partner_applications
    WHERE access_pin = _pin AND status = 'approved' AND is_active = true LIMIT 1;
  IF _pa.id IS NULL THEN RAISE EXCEPTION 'PIN inválido'; END IF;
  UPDATE public.chats SET partner_unread = 0, updated_at = now()
    WHERE id = _chat_id AND partner_id = _pa.id;
  UPDATE public.messages SET read = true
    WHERE chat_id = _chat_id AND sender_type = 'customer' AND read = false;
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;
