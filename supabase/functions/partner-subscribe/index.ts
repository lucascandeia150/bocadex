import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLAN_AMOUNT = 9.9;
const PLAN_NAME = "Bocadex Parceiros — Mensal";

interface Body {
  partner_id: string;
  back_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "Pagamento indisponível no momento." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Body;
    try { body = (await req.json()) as Body; } catch {
      return new Response(JSON.stringify({ error: "Requisição inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.partner_id) {
      return new Response(JSON.stringify({ error: "partner_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: partner, error: pErr } = await supabase
      .from("partner_applications")
      .select("id, business_name, whatsapp, owner_name")
      .eq("id", body.partner_id)
      .maybeSingle();
    if (pErr || !partner) {
      return new Response(JSON.stringify({ error: "Loja não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalReference = `sub_${crypto.randomUUID()}`;

    const { error: insErr } = await supabase.from("payments").insert({
      external_reference: externalReference,
      status: "pending",
      amount: PLAN_AMOUNT,
      partner_id: partner.id,
      customer_name: partner.owner_name || partner.business_name,
      customer_phone: partner.whatsapp,
      delivery_address: "—",
      order_description: `Assinatura mensal — ${partner.business_name}`,
      payment_type: "partner_subscription",
      metadata: { partner_name: partner.business_name, plan: "monthly_990" },
    });
    if (insErr) throw new Error(insErr.message);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const preferencePayload = {
      items: [{
        title: PLAN_NAME,
        description: `Plano mensal para ${partner.business_name}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: PLAN_AMOUNT,
      }],
      payer: { name: partner.owner_name || partner.business_name, phone: { number: partner.whatsapp } },
      external_reference: externalReference,
      notification_url: webhookUrl,
      back_urls: body.back_url
        ? { success: body.back_url, failure: body.back_url, pending: body.back_url }
        : undefined,
      auto_return: body.back_url ? "approved" : undefined,
      statement_descriptor: "Bocadex",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencePayload),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error", mpData);
      return new Response(JSON.stringify({ error: mpData?.message || "Erro Mercado Pago", details: mpData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("payments").update({ mp_preference_id: mpData.id }).eq("external_reference", externalReference);

    return new Response(JSON.stringify({
      external_reference: externalReference,
      preference_id: mpData.id,
      init_point: mpData.init_point,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});