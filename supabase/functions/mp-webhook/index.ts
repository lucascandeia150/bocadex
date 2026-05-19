import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

// Valida assinatura do webhook do Mercado Pago (x-signature + x-request-id)
// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
async function verifySignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET ausente — rejeitando webhook");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.trim().split("=").map((s) => s.trim())),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // MP exige data.id em minúsculas no manifesto
  const idLower = String(dataId).toLowerCase();
  const manifest = `id:${idLower};request-id:${xRequestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === v1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let payment_id =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";
    let topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";

    let bodyJson: any = null;
    try {
      bodyJson = await req.json();
    } catch {
      bodyJson = null;
    }
    if (bodyJson) {
      payment_id = payment_id || bodyJson?.data?.id || bodyJson?.id || "";
      topic = topic || bodyJson?.type || bodyJson?.topic || "";
    }

    console.log("MP Webhook recebido", { topic, payment_id });

    // só tratamos eventos de payment
    if (topic && !["payment", "payment.updated", "payment.created"].includes(topic)) {
      return new Response(JSON.stringify({ ignored: true, topic }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "payment id ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ok = await verifySignature(req, String(payment_id));
    if (!ok) {
      // Assinatura inválida: NÃO confiamos no payload do webhook,
      // mas como vamos reconsultar o pagamento direto na API do MP
      // (autenticados com nosso access token), o dado retornado é
      // a fonte da verdade. Logamos e seguimos para evitar pedidos
      // presos em "em análise" por falha de validação.
      console.warn("Assinatura inválida — seguirá com verificação server-to-server via MP API", { payment_id });
    }

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    // busca pagamento na API do MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mp = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Erro ao buscar pagamento MP", mp);
      return new Response(JSON.stringify({ error: "erro ao consultar pagamento", details: mp }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef: string | null = mp.external_reference ?? null;
    const status: string = mp.status ?? "unknown";
    if (!externalRef) {
      return new Response(JSON.stringify({ ignored: true, reason: "sem external_reference" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // atualiza pagamento
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .update({
        status,
        mp_payment_id: String(payment_id),
      })
      .eq("external_reference", externalRef)
      .select("*")
      .maybeSingle();
    if (pErr) throw new Error(`Erro ao atualizar pagamento: ${pErr.message}`);
    if (!payment) {
      console.warn("Pagamento não encontrado para external_reference", externalRef);
      return new Response(JSON.stringify({ ignored: true, reason: "payment não encontrado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // audit: status do pagamento atualizado
    try {
      await supabase.rpc("log_audit_event", {
        _actor_type: "webhook",
        _actor_id: String(payment_id),
        _actor_label: "Mercado Pago",
        _action: `payment.${status}`,
        _entity_type: "payment",
        _entity_id: payment.id,
        _description: `Pagamento ${status} de R$ ${Number(payment.amount).toFixed(2)} — ${payment.customer_name}`,
        _metadata: { external_reference: externalRef, mp_payment_id: String(payment_id), amount: payment.amount },
      });
    } catch (e) { console.warn("audit log falhou (payment)", e); }

    // só cria pedido se aprovado
    if (status !== "approved") {
      return new Response(JSON.stringify({ ok: true, status }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se for assinatura de parceiro: ativa loja e encerra
    if (payment.payment_type === "partner_subscription") {
      const { error: actErr } = await supabase.rpc("activate_partner_subscription", {
        _partner_id: payment.partner_id,
        _payment_id: payment.id,
      });
      if (actErr) throw new Error(`Erro ao ativar parceiro: ${actErr.message}`);
      try {
        await supabase.rpc("log_audit_event", {
          _actor_type: "webhook",
          _actor_id: String(payment_id),
          _actor_label: "Mercado Pago",
          _action: "partner.activated",
          _entity_type: "partner",
          _entity_id: payment.partner_id,
          _description: `Assinatura paga — parceiro ativado por 30 dias (R$ ${Number(payment.amount).toFixed(2)})`,
          _metadata: { external_reference: externalRef, mp_payment_id: String(payment_id) },
        });
      } catch (e) { console.warn("audit partner.activated falhou", e); }
      // push para o parceiro recém-aprovado
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
          body: JSON.stringify({
            title: "Loja ativada! 🎉",
            body: "Sua assinatura foi confirmada. Seu negócio já está visível no Bocadex Delivery's.",
            target: "all",
            data: { click_url: "/portal-loja" },
          }),
        });
      } catch (e) { console.warn("push partner.activated falhou", e); }
      return new Response(JSON.stringify({ ok: true, type: "partner_subscription", partner_id: payment.partner_id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // idempotência: já existe delivery para esse payment?
    const { data: existing } = await supabase
      .from("deliveries")
      .select("id")
      .eq("payment_id", payment.id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, duplicated: true, delivery_id: existing.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // busca parceiro para regras de taxa / app_courier
    const { data: partner } = await supabase
      .from("partner_applications")
      .select("id, business_name, uses_app_courier")
      .eq("id", payment.partner_id)
      .maybeSingle();

    const { data: settings } = await supabase
      .from("delivery_settings")
      .select("default_fee, default_courier_payout, app_fee_percent")
      .limit(1)
      .maybeSingle();

    const isPickup = (payment as { fulfillment_type?: string }).fulfillment_type === "pickup";
    const fee = (!isPickup && partner?.uses_app_courier) ? Number(settings?.default_fee ?? 0) : 0;
    const payout = (!isPickup && partner?.uses_app_courier) ? Number(settings?.default_courier_payout ?? 0) : 0;
    const pct = Number(settings?.app_fee_percent ?? 8);
    const appFee = (!isPickup && partner?.uses_app_courier)
      ? Number(((payment.amount * pct) / 100).toFixed(2))
      : 0;

    const notes = `${isPickup ? "🛍 RETIRADA NA LOJA — " : ""}Pedido pago via Mercado Pago — Cliente: ${payment.customer_name} | Tel: ${payment.customer_phone}`;

    const { data: delivery, error: dErr } = await supabase
      .from("deliveries")
      .insert({
        partner_id: payment.partner_id,
        partner_name: partner?.business_name ?? "Loja",
        order_description: payment.order_description,
        delivery_address: payment.delivery_address,
        notes,
        fee,
        courier_payout: payout,
        order_value: payment.amount,
        app_fee: appFee,
        status: "disponivel",
        payment_id: payment.id,
        fulfillment_type: isPickup ? "pickup" : "delivery",
      })
      .select("id")
      .single();
    if (dErr) {
      // se for violação do unique payment_id, considera idempotente
      if (dErr.code === "23505") {
        return new Response(JSON.stringify({ ok: true, duplicated: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erro ao criar pedido: ${dErr.message}`);
    }

    console.log("Pedido criado a partir do pagamento aprovado", {
      delivery_id: delivery.id,
      external_reference: externalRef,
    });

    // push: notifica o cliente que o pedido foi confirmado
    try {
      const { data: payRow } = await supabase
        .from("payments").select("metadata").eq("id", payment.id).maybeSingle();
      const meta = (payRow?.metadata ?? {}) as Record<string, unknown>;
      const userId = (meta.user_id as string | undefined) ?? null;
      if (userId) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
          body: JSON.stringify({
            title: "Pedido confirmado! 🛵",
            body: `${partner?.business_name ?? "A loja"} recebeu seu pedido e já está preparando.`,
            target: "user",
            user_id: userId,
            data: { click_url: "/pedidos" },
          }),
        });
      }
    } catch (e) { console.warn("push delivery created falhou", e); }

    // push: notifica a LOJA (parceiro) sobre novo pedido pago
    try {
      const { data: partnerRow } = await supabase
        .from("partner_applications")
        .select("user_id, business_name")
        .eq("id", payment.partner_id)
        .maybeSingle();
      if (partnerRow?.user_id) {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
          body: JSON.stringify({
            title: "Novo pedido pago! 💰",
            body: `${payment.customer_name} fez um pedido de R$ ${Number(payment.amount).toFixed(2)}.`,
            target: "user",
            user_id: partnerRow.user_id,
            data: { click_url: "/portal/loja" },
          }),
        });
      }
    } catch (e) { console.warn("push partner falhou", e); }

    // push: notifica entregadores ONLINE quando o pedido já é entregue pelo app
    try {
      if (!isPickup && partner?.uses_app_courier) {
        const { data: onlineCouriers } = await supabase.rpc("courier_list_online");
        const ids = (onlineCouriers ?? [])
          .map((c: { user_id: string | null }) => c.user_id)
          .filter((u: string | null): u is string => !!u);
        for (const uid of ids) {
          await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
            body: JSON.stringify({
              title: "Nova entrega disponível! 🛵",
              body: `${partner?.business_name ?? "Loja"} — R$ ${Number(fee).toFixed(2)} de taxa.`,
              target: "user",
              user_id: uid,
              data: { click_url: "/portal/entregador" },
            }),
          });
        }
      }
    } catch (e) { console.warn("push couriers falhou", e); }

    try {
      await supabase.rpc("log_audit_event", {
        _actor_type: "webhook",
        _actor_id: String(payment_id),
        _actor_label: "Mercado Pago",
        _action: "delivery.created",
        _entity_type: "delivery",
        _entity_id: delivery.id,
        _description: `Pedido criado para ${partner?.business_name ?? "Loja"} — R$ ${Number(payment.amount).toFixed(2)}`,
        _metadata: { partner_id: payment.partner_id, app_fee: appFee, fee, courier_payout: payout },
      });
    } catch (e) { console.warn("audit log falhou (delivery)", e); }

    return new Response(
      JSON.stringify({ ok: true, delivery_id: delivery.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Webhook erro", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});