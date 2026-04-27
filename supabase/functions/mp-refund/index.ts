import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Reembolsa (parcial ou total) um pagamento Mercado Pago e cancela a entrega
 * associada. Requer: usuário admin autenticado.
 *
 * Body: { payment_id: uuid, amount?: number, reason?: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || "admin";

    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const paymentRowId: string | undefined = body.payment_id;
    const amount: number | undefined = body.amount;
    const reason: string = body.reason || "";
    if (!paymentRowId) {
      return new Response(JSON.stringify({ error: "payment_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: payment, error: pErr } = await supabase
      .from("payments").select("*").eq("id", paymentRowId).maybeSingle();
    if (pErr || !payment) {
      return new Response(JSON.stringify({ error: "pagamento não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!payment.mp_payment_id) {
      return new Response(JSON.stringify({ error: "pagamento sem ID do Mercado Pago" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const refundBody: Record<string, unknown> = {};
    if (amount && amount > 0) refundBody.amount = Number(amount);

    const idem = crypto.randomUUID();
    const refundRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment.mp_payment_id}/refunds`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idem,
        },
        body: Object.keys(refundBody).length ? JSON.stringify(refundBody) : "{}",
      },
    );
    const refundJson = await refundRes.json();
    if (!refundRes.ok) {
      return new Response(JSON.stringify({ error: "Mercado Pago recusou", details: refundJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refundedAmount = Number(refundJson.amount ?? amount ?? payment.amount);
    const isFull = !amount || refundedAmount >= Number(payment.amount);

    // Atualiza status do pagamento
    await supabase.from("payments")
      .update({ status: isFull ? "refunded" : "partially_refunded" })
      .eq("id", payment.id);

    // Cancela entregas vinculadas (se ainda não estiverem concluídas)
    const { data: deliveries } = await supabase
      .from("deliveries").select("id,status").eq("payment_id", payment.id);
    if (deliveries) {
      for (const d of deliveries) {
        if (d.status !== "concluida" && d.status !== "cancelada") {
          await supabase.from("deliveries")
            .update({ status: "cancelada" }).eq("id", d.id);
        }
      }
    }

    await supabase.rpc("log_audit_event", {
      _actor_type: "admin",
      _actor_id: userId,
      _actor_label: userEmail,
      _action: isFull ? "payment.refunded" : "payment.partially_refunded",
      _entity_type: "payment",
      _entity_id: payment.id,
      _description: `Reembolso ${isFull ? "total" : "parcial"} de R$ ${refundedAmount.toFixed(2)} — ${payment.customer_name}${reason ? ` · motivo: ${reason}` : ""}`,
      _metadata: { mp_refund_id: refundJson.id, amount: refundedAmount, reason },
    });

    return new Response(JSON.stringify({
      ok: true, refund_id: refundJson.id, amount: refundedAmount, full: isFull,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("mp-refund erro", e);
    const msg = e instanceof Error ? e.message : "Erro";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});