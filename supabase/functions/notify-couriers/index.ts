// Public function — autenticado via JWT do cliente — dispara push a todos
// entregadores ativos online quando um novo pedido fica disponível.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { delivery_id, partner_name, address } = body as {
      delivery_id?: string; partner_name?: string; address?: string;
    };
    if (!delivery_id) {
      return new Response(JSON.stringify({ error: 'delivery_id obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const uid = (claims.claims.sub as string) || "";

    // Confirma que o pedido existe e ainda está disponível
    const { data: delivery } = await admin
      .from('deliveries')
      .select('id, status, courier_id, partner_name, delivery_address, partner_id')
      .eq('id', delivery_id)
      .maybeSingle();
    if (!delivery || delivery.status !== 'disponivel' || delivery.courier_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Autorização: somente admin ou parceiro dono do pedido pode disparar
    const { data: adminRole } = await admin
      .from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').maybeSingle();
    const isAdmin = !!adminRole;
    let isOwnerPartner = false;
    if (!isAdmin && delivery.partner_id) {
      const { data: ownPartner } = await admin
        .from('partner_applications')
        .select('id').eq('id', delivery.partner_id).eq('user_id', uid).maybeSingle();
      isOwnerPartner = !!ownPartner;
    }
    if (!isAdmin && !isOwnerPartner) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lista user_ids dos entregadores ativos e online
    const { data: couriers } = await admin
      .from('couriers')
      .select('user_id')
      .eq('is_active', true)
      .eq('is_online', true);
    const userIds = Array.from(new Set((couriers ?? [])
      .map((c: { user_id: string | null }) => c.user_id)
      .filter((u): u is string => !!u)));

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, info: 'nenhum entregador online' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: tokenRows } = await admin
      .from('device_tokens')
      .select('token')
      .in('user_id', userIds);
    const tokens = (tokenRows ?? []).map((t: { token: string }) => t.token);

    // Histórico interno
    await admin.from('user_notifications').insert(userIds.map((uid) => ({
      user_id: uid,
      title: '🛵 Novo pedido disponível',
      body: `${partner_name ?? delivery.partner_name} — ${address ?? delivery.delivery_address}`,
      click_url: '/portal-entregador',
      data: { delivery_id, type: 'new_delivery' },
    })));

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, info: 'sem tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reaproveita o sender principal via secret de service role
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({
        title: '🛵 Novo pedido disponível',
        body: `${partner_name ?? delivery.partner_name} — toque para aceitar`,
        data: { click_url: '/portal-entregador', delivery_id, type: 'new_delivery' },
        tokens,
        internal_secret: SERVICE_ROLE,
      }),
    });
    const json = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: true, ...json }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});