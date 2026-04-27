import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  partner_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  order_description: string;
  amount: number;
  back_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const body = (await req.json()) as Body;
    if (!body.partner_id || !body.customer_name || !body.customer_phone ||
        !body.delivery_address || !body.order_description || !body.amount) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const amount = Number(body.amount);
    if (!isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Valor inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // valida parceiro aprovado/aberto
    const { data: partner, error: pErr } = await supabase
      .from("partner_applications")
      .select("id, business_name, is_open, status, is_active")
      .eq("id", body.partner_id)
      .eq("status", "approved")
      .eq("is_active", true)
      .maybeSingle();
    if (pErr || !partner) {
      return new Response(JSON.stringify({ error: "Loja indisponível" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!partner.is_open) {
      return new Response(JSON.stringify({ error: "Loja fechada no momento" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalReference = crypto.randomUUID();

    // grava pagamento pendente
    const { error: insErr } = await supabase.from("payments").insert({
      external_reference: externalReference,
      status: "pending",
      amount,
      partner_id: body.partner_id,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      delivery_address: body.delivery_address,
      order_description: body.order_description,
      metadata: { partner_name: partner.business_name },
    });
    if (insErr) throw new Error(`Erro ao registrar pagamento: ${insErr.message}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const preferencePayload = {
      items: [
        {
          title: `Pedido EscolheAí — ${partner.business_name}`,
          description: body.order_description.slice(0, 240),
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(amount.toFixed(2)),
        },
      ],
      payer: {
        name: body.customer_name,
        phone: { number: body.customer_phone },
      },
      external_reference: externalReference,
      notification_url: webhookUrl,
      metadata: {
        partner_id: body.partner_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
      },
      back_urls: body.back_url
        ? { success: body.back_url, failure: body.back_url, pending: body.back_url }
        : undefined,
      auto_return: body.back_url ? "approved" : undefined,
      statement_descriptor: "EscolheAi",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Mercado Pago error", mpData);
      return new Response(JSON.stringify({ error: "Falha ao criar preferência", details: mpData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("payments")
      .update({ mp_preference_id: mpData.id })
      .eq("external_reference", externalReference);

    return new Response(
      JSON.stringify({
        external_reference: externalReference,
        preference_id: mpData.id,
        init_point: mpData.init_point,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});