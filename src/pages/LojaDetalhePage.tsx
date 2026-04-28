import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Slug helper: converte "Biscoito da Tetê" → "biscoito-da-tete"
function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Página legada: /loja/:id agora apenas redireciona para /parceiro/:uuid.
 * - Se o id for um UUID válido, redireciona direto.
 * - Se for um slug, busca o parceiro no banco pelo nome correspondente.
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
      const { data } = await supabase
        .from("partner_applications")
        .select("id, business_name")
        .eq("status", "approved")
        .eq("is_active", true);
      const match = (data ?? []).find((p) => slugify(p.business_name) === id);
      if (match) {
        setResolvedId(match.id);
        setStatus("found");
      } else {
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
      <button onClick={() => navigate("/lojas")} className="mt-4 text-primary font-semibold text-sm">
        ← Ver todas as lojas
      </button>
    </div>
  );
}
