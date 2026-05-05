import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Rota legada /loja/:id — redireciona para /parceiro/:uuid.
 * - Aceita UUID direto
 * - Aceita slug do business_name (fallback)
 */
export default function LojaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "notfound">("loading");

  useEffect(() => {
    if (!id) {
      setStatus("notfound");
      return;
    }
    if (UUID_RE.test(id)) {
      setResolvedId(id);
      setStatus("found");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("partner_applications")
        .select("id, business_name")
        .eq("status", "approved")
        .eq("is_active", true);
      if (error) console.error("[LojaDetalhe] busca falhou:", error);
      const match = (data ?? []).find((p) => slugify(p.business_name) === id);
      if (match) {
        setResolvedId(match.id);
        setStatus("found");
      } else {
        console.warn("[LojaDetalhe] loja não encontrada para id/slug:", id);
        setStatus("notfound");
      }
    })();
  }, [id]);

  if (status === "loading") {
    return (
      <div className="px-4 pt-12 text-center animate-slide-up">
        <span className="text-4xl block mb-3">⏳</span>
        <p className="text-muted-foreground text-sm">Carregando loja…</p>
      </div>
    );
  }

  if (status === "found" && resolvedId) {
    return <Navigate to={`/parceiro/${resolvedId}`} replace />;
  }

  return (
    <div className="px-4 pt-12 text-center animate-slide-up">
      <span className="text-5xl block mb-3">🏪</span>
      <p className="text-foreground font-bold text-lg">Loja não encontrada</p>
      <p className="text-muted-foreground text-sm mt-2">Talvez ela tenha saído do ar.</p>
      <div className="flex flex-col gap-2 mt-5 max-w-xs mx-auto">
        <button
          onClick={() => navigate("/lojas")}
          className="bg-primary text-primary-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Ver outras lojas
        </button>
        <button
          onClick={() => navigate("/buscar")}
          className="text-primary font-semibold text-sm py-2"
        >
          🔍 Buscar lojas
        </button>
      </div>
    </div>
  );
}
