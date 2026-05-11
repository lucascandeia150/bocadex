import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2, Home, ChefHat, Bike, Package, CreditCard, Sparkles, Dumbbell, Star } from "lucide-react";
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
  const flowType = params.get("type"); // "partner" para assinatura
  const isPartner = flowType === "partner" || (ref?.startsWith("sub_") ?? false);
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-payment-status?ref=${encodeURIComponent(ref)}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
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
    if (!ref || status !== "approved" || isPartner) return;
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
  }, [ref, status, isPartner]);

  const heroBg =
    status === "approved"
      ? "from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)]"
      : status === "pending" || status === "loading"
      ? "from-[hsl(24,95%,53%)] to-[hsl(24,95%,45%)]"
      : "from-[hsl(0,75%,55%)] to-[hsl(0,75%,45%)]";

  const heroIcon = () => {
    if (status === "loading") return <Loader2 className="animate-spin" size={44} />;
    if (status === "approved") return <CheckCircle2 size={48} strokeWidth={2.5} />;
    if (status === "pending") return <Clock size={48} strokeWidth={2.5} />;
    return <XCircle size={48} strokeWidth={2.5} />;
  };

  const heroTitle = () => {
    if (status === "loading") return "Confirmando pagamento...";
    if (status === "approved") return isPartner ? "Loja ativada! 🎉" : "Pagamento aprovado!";
    if (status === "pending") return "Pagamento em análise";
    if (status === "failed") return "Pagamento não aprovado";
    return "Pagamento não encontrado";
  };

  const heroMsg = () => {
    if (status === "approved")
      return isPartner
        ? "Sua loja já está visível no Bocadex Delivery's. Bons pedidos!"
        : "Seu pedido foi enviado para a loja e já está sendo preparado.";
    if (status === "pending")
      return "Aguardando confirmação do Mercado Pago. PIX leva alguns segundos.";
    if (status === "failed")
      return "Tente novamente ou use outra forma de pagamento.";
    if (status === "not_found")
      return "Não localizamos esse pagamento. Volte para o início.";
    return "Conectando ao Mercado Pago para confirmar...";
  };

  return (
    <div className="pb-32">
      {/* Hero status */}
      <div className={`bg-gradient-to-br ${heroBg} text-white px-5 pt-10 pb-16 relative overflow-hidden animate-slide-up`}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 25% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
        <div className="relative max-w-sm mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-2xl">
            {heroIcon()}
          </div>
          {status === "approved" && (
            <Sparkles size={14} className="inline-block mr-1 -mt-1 animate-pulse" />
          )}
          <h1 className="text-2xl font-black leading-tight">{heroTitle()}</h1>
          <p className="text-sm opacity-95 mt-2 max-w-xs mx-auto leading-snug">{heroMsg()}</p>
          {info?.amount != null && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-sm font-black">
              <CreditCard size={14} /> R${Number(info.amount).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 -mt-10 relative z-10 space-y-4">
        {/* Loading do delivery */}
        {status === "approved" && !isPartner && !delivery && (
          <div className="rounded-2xl bg-card border border-border shadow-lg p-5 text-center animate-slide-up">
            <Loader2 className="animate-spin text-primary mx-auto" size={28} />
            <p className="text-sm font-bold text-foreground mt-2">Preparando seu pedido...</p>
            <p className="text-xs text-muted-foreground mt-1">A loja está sendo notificada agora.</p>
          </div>
        )}

        {status === "approved" && !isPartner && delivery && (
          <OrderTimeline
            status={delivery.status}
            code={delivery.delivery_code}
            partner={delivery.partner_name}
          />
        )}

        {status === "approved" && isPartner && (
          <div className="rounded-2xl bg-card border border-border shadow-lg p-5 text-center animate-slide-up space-y-2">
            <Sparkles className="text-primary mx-auto" size={28} />
            <p className="text-sm font-black text-foreground">Bem-vindo ao Bocadex Delivery's! 🚀</p>
            <p className="text-xs text-muted-foreground">
              Sua loja foi publicada automaticamente. Acesse o portal do parceiro para gerenciar produtos e pedidos.
            </p>
            <button
              onClick={() => navigate("/acesso-parceiro")}
              className="mt-2 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-black text-xs px-4 py-2.5 rounded-full"
            >
              Acessar painel da loja →
            </button>
          </div>
        )}

        {status === "approved" && (
          <a
            href="https://shapeturbo.escolheai.today"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform animate-slide-up"
          >
            <div className="bg-gradient-to-br from-[hsl(280,70%,45%)] to-[hsl(24,95%,53%)] p-4 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-20">
                <Dumbbell size={96} strokeWidth={2.5} />
              </div>
              <div className="relative">
                <p className="text-base font-black leading-tight">
                  💪 Parabéns pelo seu pedido!
                </p>
                <p className="text-xs opacity-95 mt-1 leading-snug max-w-[85%]">
                  Agora que você já garantiu sua refeição, que tal cuidar do seu resultado?
                </p>
                <span className="inline-flex items-center gap-1.5 mt-3 bg-white text-[hsl(280,70%,40%)] text-xs font-black px-3.5 py-2 rounded-full shadow-md">
                  Acessar Shape Turbo →
                </span>
              </div>
            </div>
          </a>
        )}

        {status === "approved" && !isPartner && (
          <button
            onClick={() => navigate("/avaliar")}
            className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition-transform animate-slide-up"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
              <Star className="text-yellow-500 fill-yellow-500" size={18} />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-foreground">Avalie sua experiência ⭐</p>
              <p className="text-[11px] text-muted-foreground">Conte como foi seu pedido (leva 10s)</p>
            </div>
          </button>
        )}

        {(status === "pending" || status === "loading") && (
          <div className="rounded-2xl bg-card border border-border shadow-lg p-5 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/15 flex items-center justify-center shrink-0">
                <Loader2 className="animate-spin text-secondary" size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">Atualizando em tempo real</p>
                <p className="text-[11px] text-muted-foreground">
                  Esta tela atualiza sozinha quando o pagamento confirmar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
        <div className="max-w-sm mx-auto space-y-2">
          {status === "approved" ? (
            <>
              <button
                onClick={() => navigate("/pedidos?tab=historico")}
                className="w-full bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
              >
                <Package size={18} /> Acompanhar meus pedidos
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-card border-2 border-border text-foreground font-bold py-2.5 rounded-2xl active:scale-95 transition-transform text-xs"
              >
                Voltar para o início
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-base shadow-lg"
            >
              <Home size={18} /> Voltar para o início
            </button>
          )}
        </div>
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
  const steps: {
    key: DeliveryStatus | "paid";
    label: string;
    desc: string;
    Icon: typeof Clock;
  }[] = [
    { key: "paid", label: "Pagamento confirmado", desc: "Seu pedido foi pago com sucesso", Icon: CheckCircle2 },
    { key: "aceita", label: "Em preparo", desc: "A loja está preparando seu pedido", Icon: ChefHat },
    { key: "em_andamento", label: "Saiu para entrega", desc: "O entregador está a caminho", Icon: Bike },
    { key: "concluida", label: "Entregue", desc: "Bom apetite!", Icon: Package },
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

  if (status === "cancelada") {
    return (
      <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 text-center animate-slide-up">
        <XCircle className="text-destructive mx-auto mb-2" size={32} />
        <p className="text-sm font-black text-foreground">Pedido cancelado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Entre em contato com {partner} para mais informações.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border shadow-lg overflow-hidden animate-slide-up">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-3 border-b border-border">
        <p className="text-[10px] font-black text-primary uppercase tracking-wider">Pedido em andamento</p>
        <p className="text-sm font-black text-foreground mt-0.5 truncate">🏪 {partner}</p>
      </div>

      {/* Código de entrega — bem destacado */}
      {code && status !== "concluida" && (
        <div className="px-4 pt-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/40 p-3 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">🔐 Código de entrega</p>
            <p className="text-3xl font-black text-primary tracking-[0.5em] mt-1 ml-2">{code}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Informe ao entregador na entrega</p>
          </div>
        </div>
      )}

      {/* Timeline com linha conectora */}
      <ol className="px-4 py-5 space-y-1">
        {steps.map((s, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const isLast = i === steps.length - 1;
          return (
            <li key={s.key} className="flex gap-3 relative">
              {/* Linha conectora */}
              {!isLast && (
                <span
                  className={`absolute left-[18px] top-9 bottom-0 w-0.5 ${
                    i < currentIdx ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                  done
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                } ${active ? "ring-4 ring-primary/25 animate-pulse" : ""}`}
              >
                <s.Icon size={16} strokeWidth={2.5} />
              </div>
              <div className="flex-1 pb-5 pt-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-black ${
                      done ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </p>
                  {active && (
                    <span className="text-[9px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase animate-pulse">
                      Agora
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}