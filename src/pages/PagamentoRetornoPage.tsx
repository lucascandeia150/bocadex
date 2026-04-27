import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "approved" | "pending" | "failed" | "not_found";

export default function PagamentoRetornoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ref = params.get("ref") ?? params.get("external_reference");
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<{ amount?: number; partner?: string } | null>(null);

  useEffect(() => {
    if (!ref) {
      setStatus("not_found");
      return;
    }
    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      attempts += 1;
      try {
        const { data, error } = await supabase.functions.invoke("mp-payment-status", {
          body: null,
        });
        // edge function lê via query string; usar fetch direto
        void data; void error;
      } catch { /* ignore */ }

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-payment-status?ref=${encodeURIComponent(ref)}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.found) {
          setStatus("not_found");
          return;
        }
        setInfo({ amount: json.amount, partner: json.partner_id });
        if (json.status === "approved") {
          setStatus("approved");
          return;
        }
        if (["rejected", "cancelled", "refunded", "charged_back"].includes(json.status)) {
          setStatus("failed");
          return;
        }
        setStatus("pending");
        if (attempts < 12) {
          setTimeout(poll, 2500);
        }
      } catch {
        if (attempts < 12) setTimeout(poll, 2500);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [ref]);

  const renderIcon = () => {
    if (status === "loading") return <Loader2 className="animate-spin text-primary" size={48} />;
    if (status === "approved") return <CheckCircle2 className="text-primary" size={56} />;
    if (status === "pending") return <Clock className="text-secondary" size={56} />;
    return <XCircle className="text-destructive" size={56} />;
  };

  const renderTitle = () => {
    if (status === "loading") return "Confirmando pagamento...";
    if (status === "approved") return "Pagamento aprovado! 🎉";
    if (status === "pending") return "Pagamento em análise";
    if (status === "failed") return "Pagamento não aprovado";
    return "Pagamento não encontrado";
  };

  const renderMsg = () => {
    if (status === "approved")
      return "Seu pedido foi enviado para a loja e já está disponível para os entregadores.";
    if (status === "pending")
      return "Estamos aguardando a confirmação do Mercado Pago. Pode levar alguns segundos para PIX e até alguns minutos para boleto.";
    if (status === "failed")
      return "Tente novamente ou use outra forma de pagamento.";
    if (status === "not_found")
      return "Não localizamos esse pagamento. Volte para o início.";
    return "";
  };

  return (
    <div className="px-4 pt-12 pb-24 max-w-sm mx-auto text-center animate-slide-up">
      <div className="flex justify-center mb-4">{renderIcon()}</div>
      <h1 className="text-2xl font-black text-foreground">{renderTitle()}</h1>
      <p className="text-sm text-muted-foreground mt-2">{renderMsg()}</p>

      {info?.amount != null && (
        <p className="mt-4 text-base font-black text-primary">
          Valor: R${Number(info.amount).toFixed(2)}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <button
          onClick={() => navigate("/")}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Home size={16} /> Voltar para o início
        </button>
        {status === "approved" && (
          <button
            onClick={() => navigate("/pedidos?tab=historico")}
            className="w-full bg-background border-2 border-border text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform"
          >
            Ver meus pedidos
          </button>
        )}
      </div>
    </div>
  );
}