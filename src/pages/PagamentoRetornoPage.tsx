import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, Home, ChefHat, Bike, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "approved" | "pending" | "failed" | "not_found";

type DeliveryStatus = "disponivel" | "aceita" | "em_andamento" | "concluida" | "cancelada";

interface DeliveryRow {
  id: string;
  status: DeliveryStatus;
  partner_name: string;
  delivery_code: string | null;
  order_value: number;
}

export default function PagamentoRetornoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ref = params.get("ref") ?? params.get("external_reference");
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<{ amount?: number; partner?: string } | null>(null);
  const [delivery, setDelivery] = useState<DeliveryRow | null>(null);

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

  // Realtime: assim que o pagamento for aprovado, o webhook cria o delivery
  // ligado a esse external_reference (payment_id). Buscamos e escutamos updates.
  useEffect(() => {
    if (!ref || status !== "approved") return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const fetchDelivery = async () => {
      const { data: pay } = await supabase
        .from("payments")
        .select("id")
        .eq("external_reference", ref)
        .maybeSingle();
      if (!pay?.id || cancelled) return;

      const { data: del } = await supabase
        .from("deliveries")
        .select("id, status, partner_name, delivery_code, order_value")
        .eq("payment_id", pay.id)
        .maybeSingle();
      if (cancelled) return;
      if (del) setDelivery(del as DeliveryRow);

      // Escuta atualizações em tempo real do pedido
      channel = supabase
        .channel(`order-${pay.id}`)
        .on(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "postgres_changes" as any,
          { event: "*", schema: "public", table: "deliveries", filter: `payment_id=eq.${pay.id}` },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            if (payload?.new) setDelivery(payload.new as DeliveryRow);
          },
        )
        .subscribe();
    };

    fetchDelivery();
    // tenta novamente em 3s caso o webhook ainda não tenha criado a entrega
    const retry = setTimeout(fetchDelivery, 3000);

    return () => {
      cancelled = true;
      clearTimeout(retry);
      if (channel) supabase.removeChannel(channel);
    };
  }, [ref, status]);

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

      {status === "approved" && delivery && (
        <OrderTimeline status={delivery.status} code={delivery.delivery_code} partner={delivery.partner_name} />
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

function OrderTimeline({
  status,
  code,
  partner,
}: {
  status: DeliveryStatus;
  code: string | null;
  partner: string;
}) {
  const steps: { key: DeliveryStatus | "paid"; label: string; Icon: typeof Clock }[] = [
    { key: "paid", label: "Pagamento confirmado", Icon: CheckCircle2 },
    { key: "aceita", label: "Em preparo", Icon: ChefHat },
    { key: "em_andamento", label: "Saiu para entrega", Icon: Bike },
    { key: "concluida", label: "Entregue", Icon: Package },
  ];
  const order: Record<string, number> = {
    disponivel: 0,
    paid: 0,
    aceita: 1,
    em_andamento: 2,
    concluida: 3,
    cancelada: -1,
  };
  const currentIdx = order[status] ?? 0;

  return (
    <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 text-left">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">🏪 {partner}</p>
      <p className="text-sm font-black text-foreground mt-0.5">Acompanhe seu pedido em tempo real</p>

      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s.key} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                } ${active ? "ring-4 ring-primary/30 animate-pulse" : ""}`}
              >
                <s.Icon size={16} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </p>
              </div>
              {done && !active && <CheckCircle2 size={14} className="text-primary" />}
            </li>
          );
        })}
      </ol>

      {code && status !== "concluida" && status !== "cancelada" && (
        <div className="mt-4 rounded-xl bg-background border-2 border-dashed border-primary/40 p-3 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">🔐 Código de entrega</p>
          <p className="text-2xl font-black text-primary tracking-[0.4em] mt-1">{code}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Informe ao entregador</p>
        </div>
      )}
    </div>
  );
}