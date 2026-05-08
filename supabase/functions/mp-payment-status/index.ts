import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Login obrigatório" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const ref = url.searchParams.get("ref");
    if (!ref) {
      return new Response(JSON.stringify({ error: "ref obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payment } = await supabase
      .from("payments")
      .select("id, status, amount, partner_id, metadata, mp_payment_id")
      .eq("external_reference", ref)
      .maybeSingle();

    if (!payment) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the owning user (or admin) may see payment details
    const ownerId = (payment as any)?.metadata?.user_id;
    if (ownerId && ownerId !== userData.user.id) {
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!roles) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback ativo: se ainda está pending, consulta MP direto e
    // dispara o webhook interno para criar pedido + push.
    let currentStatus = payment.status;
    if (currentStatus === "pending" || currentStatus === "in_process") {
      try {
        const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
        if (mpToken) {
          // procura por external_reference
          const search = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(ref)}&sort=date_created&criteria=desc`,
            { headers: { Authorization: `Bearer ${mpToken}` } },
          );
          const searchJson = await search.json();
          const mpPayment = searchJson?.results?.[0];
          if (mpPayment?.id) {
            const newStatus: string = mpPayment.status ?? currentStatus;
            if (newStatus !== currentStatus || !payment.mp_payment_id) {
              // chama o webhook interno (passando service-role) para
              // reaproveitar toda a lógica de criação de delivery / push
              try {
                await fetch(
                  `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook?type=payment&data.id=${mpPayment.id}`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      // não temos assinatura — webhook agora segue mesmo assim
                    },
                    body: JSON.stringify({ type: "payment", data: { id: mpPayment.id } }),
                  },
                );
              } catch (e) {
                console.warn("fallback webhook call falhou", e);
              }
              currentStatus = newStatus;
            }
          }
        }
      } catch (e) {
        console.warn("fallback MP fetch falhou", e);
      }
    }

    return new Response(JSON.stringify({
      found: true,
      status: currentStatus,
      amount: payment.amount,
      partner_id: payment.partner_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});