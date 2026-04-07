import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { rating, comment, options } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeComment = String(comment || "").slice(0, 1000);
    const safeOptions = String(options || "Nenhuma");

    const emailBody = `
Nova avaliação do app EscolheAí

Nota: ${"⭐".repeat(rating)} (${rating}/5)
Opções selecionadas: ${safeOptions}
Comentário: ${safeComment || "(sem comentário)"}

---
Enviado automaticamente pelo EscolheAí
    `.trim();

    const mailtoSubject = encodeURIComponent("Nova avaliação do app EscolheAí");

    // Store feedback in console for now (email integration can be added later)
    console.log("=== NOVA AVALIAÇÃO ===");
    console.log(`Nota: ${rating}/5`);
    console.log(`Opções: ${safeOptions}`);
    console.log(`Comentário: ${safeComment}`);
    console.log("=====================");

    return new Response(
      JSON.stringify({ success: true, message: "Feedback recebido!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing feedback:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process feedback" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
