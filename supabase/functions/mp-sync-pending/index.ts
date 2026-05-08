import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reprocesses pending payments by re-querying Mercado Pago and
// re-invoking the webhook (which is the single source of truth for
// status updates, delivery creation and push notifications).
// Idempotent: webhook already guards against duplicate deliveries.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // If called by a user (not cron), require admin
    const authHeader = req.headers.get("Authorization") || "";
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = internalSecret && internalSecret === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!isInternal) {
      const jwt = authHeader.replace("Bearer ", "");
      const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: u } = await auth.auth.getUser(jwt);
      if (!u?.user) {
        return new Response(JSON.stringify({ error: "Login obrigatório" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente");

    // Pegue só pendentes das últimas 48h para evitar varredura grande
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: pending, error: pErr } = await supabase
      .from("payments")
      .select("id, external_reference, status, mp_payment_id, created_at")
      .in("status", ["pending", "in_process"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);
    if (pErr) throw new Error(pErr.message);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const results: Array<Record<string, unknown>> = [];
    let recovered = 0, failed = 0, untouched = 0;

    for (const p of pending || []) {
      try {
        // Procura pagamento real no MP por external_reference
        const r = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(p.external_reference)}&sort=date_created&criteria=desc`,
          { headers: { Authorization: `Bearer ${mpToken}` } },
        );
        const j = await r.json();
        const mp = j?.results?.[0];
        if (!mp?.id) {
          untouched++;
          results.push({ ref: p.external_reference, status: "no_mp_payment" });
          continue;
        }

        // Reaproveita o webhook (que cria delivery, push, audit). Idempotente.
        await fetch(`${supabaseUrl}/functions/v1/mp-webhook?type=payment&data.id=${mp.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "payment", data: { id: mp.id } }),
        });

        if (mp.status === "approved") recovered++;
        else untouched++;
        results.push({ ref: p.external_reference, mp_id: mp.id, mp_status: mp.status });
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ ref: p.external_reference, error: msg });
      }
    }

    // Audit log
    try {
      await supabase.rpc("log_audit_event", {
        _actor_type: isInternal ? "system" : "admin",
        _actor_id: null,
        _actor_label: isInternal ? "cron" : "admin manual",
        _action: "payments.sync_pending",
        _entity_type: "payment",
        _entity_id: null,
        _description: `Reprocessados ${pending?.length ?? 0} pagamentos (recuperados: ${recovered}, falhas: ${failed})`,
        _metadata: { recovered, failed, untouched, total: pending?.length ?? 0 },
      });
    } catch (e) { console.warn("audit falhou", e); }

    return new Response(JSON.stringify({
      ok: true,
      total: pending?.length ?? 0,
      recovered, failed, untouched,
      results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    console.error("mp-sync-pending erro", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});