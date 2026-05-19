import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: uErr } = await userClient.auth.getUser(jwt);
    if (uErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pin, delivery_id } = await req.json();
    if (!pin || !delivery_id) {
      return new Response(JSON.stringify({ error: "pin e delivery_id obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(URL_, SR);

    // valida parceiro pelo PIN
    const { data: partner } = await admin
      .from("partner_applications")
      .select("id, business_name")
      .eq("access_pin", pin)
      .eq("status", "approved")
      .eq("is_active", true)
      .maybeSingle();
    if (!partner) {
      return new Response(JSON.stringify({ error: "PIN inválido" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // valida delivery e pega user_id
    const { data: delivery } = await admin
      .from("deliveries")
      .select("id, user_id, fulfillment_type, partner_id")
      .eq("id", delivery_id)
      .eq("partner_id", partner.id)
      .maybeSingle();
    if (!delivery) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (delivery.fulfillment_type !== "pickup" || !delivery.user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await fetch(`${URL_}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": SR },
      body: JSON.stringify({
        title: "Seu pedido está pronto para retirada 🎉",
        body: `${partner.business_name} já preparou seu pedido. Pode buscar!`,
        target: "user",
        user_id: delivery.user_id,
        data: { click_url: "/pedidos" },
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});