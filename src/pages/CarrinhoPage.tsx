import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Package, Bike, AlertTriangle, Zap, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

type Mode = "retirar" | "entrega";

export default function CarrinhoPage() {
  const navigate = useNavigate();
  const {
    items,
    partnerId,
    partnerName,
    partnerWhatsapp,
    partnerHasDelivery,
    totalItems,
    totalValue,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [mode, setMode] = useState<Mode>(partnerHasDelivery ? "entrega" : "retirar");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buildOrderDescription = () =>
    items
      .map((i) => `• ${i.name} (x${i.quantity})${i.notes ? ` — ${i.notes}` : ""}`)
      .join("\n");

  const buildWaMessage = (extra?: string) => {
    const lines = [
      `Olá, ${partnerName}! 👋`,
      ``,
      `Pedido pelo EscolheAí:`,
      buildOrderDescription(),
      ``,
      `💰 Total: R$${totalValue.toFixed(2)}`,
      `📦 Tipo: ${mode === "retirar" ? "Retirar na loja" : "Entrega"}`,
    ];
    if (name.trim()) lines.push(`👤 Nome: ${name.trim()}`);
    if (phone.trim()) lines.push(`📞 Telefone: ${phone.trim()}`);
    if (mode === "entrega" && address.trim()) lines.push(`📍 Endereço: ${address.trim()}`);
    if (extra) lines.push(``, extra);
    lines.push(``, `Pode confirmar? 😄`);
    return lines.join("\n");
  };

  const openWa = (msg: string) => {
    if (!partnerWhatsapp) return;
    const phone = partnerWhatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendWhatsAppOnly = () => {
    openWa(buildWaMessage());
    trackAnalyticsEvent("partner_click", { partner_name: partnerName ?? "", source: "cart_whatsapp" });
    trackAnalyticsEvent("whatsapp_click", { source: "cart_whatsapp" });
    toast.success("Pedido enviado para a loja!");
    clear();
    navigate(-1);
  };

  const confirmOrder = async () => {
    if (!partnerId) return;
    if (mode === "entrega") {
      if (!partnerHasDelivery) {
        toast.error("Esta loja não trabalha com entrega via app");
        return;
      }
      if (!address.trim()) {
        toast.error("Informe o endereço de entrega");
        return;
      }
    }

    if (mode === "retirar" || !partnerHasDelivery) {
      // sem entregador do app — envia direto pra loja via WhatsApp
      sendWhatsAppOnly();
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc("customer_create_delivery", {
      _partner_id: partnerId,
      _order_description: buildOrderDescription(),
      _delivery_address: address.trim(),
      _customer_name: name.trim() || "Cliente",
      _customer_phone: phone.trim(),
      _order_value: totalValue,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Não foi possível criar o pedido");
      return;
    }

    toast.success("Pedido enviado! Procurando entregador...");
    openWa(buildWaMessage("✅ Pedido criado no app — entregador a caminho."));
    trackAnalyticsEvent("partner_click", { partner_name: partnerName ?? "", source: "cart_order" });
    clear();
    navigate(-1);
  };

  if (items.length === 0) {
    return (
      <div className="px-4 pt-12 text-center animate-slide-up">
        <span className="text-6xl block mb-3">🛒</span>
        <h1 className="text-foreground font-black text-xl">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha uma loja e adicione produtos!</p>
        <button
          onClick={() => navigate("/lojas")}
          className="mt-5 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-2xl text-sm active:scale-95 transition-transform"
        >
          Explorar lojas
        </button>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <div className="bg-gradient-to-b from-secondary/20 to-background px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ShoppingBag size={22} className="text-primary" /> Seu carrinho
        </h1>
        {partnerName && (
          <p className="text-xs text-muted-foreground mt-1">
            🏪 {partnerName} · {totalItems} {totalItems === 1 ? "item" : "itens"}
          </p>
        )}
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-4">
        {/* Itens */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-2xl border border-border bg-card shadow-sm p-4 animate-slide-up"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">R${item.unitPrice.toFixed(2)} cada</p>
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground italic mt-1">📝 {item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 rounded-full text-destructive hover:bg-destructive/10 active:scale-90 transition-transform shrink-0"
                  aria-label="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-base font-black text-foreground w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-base font-black text-primary">
                  R${(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modo de entrega */}
        <div className="rounded-2xl border border-border bg-card p-4 animate-slide-up">
          <p className="text-xs font-bold text-foreground mb-2">Como você quer receber?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("retirar")}
              className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                mode === "retirar" ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
            >
              <Package size={18} className={mode === "retirar" ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-black text-foreground mt-1">Retirar</p>
              <p className="text-[10px] text-muted-foreground">na loja</p>
            </button>
            <button
              onClick={() => partnerHasDelivery && setMode("entrega")}
              disabled={!partnerHasDelivery}
              className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                !partnerHasDelivery
                  ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                  : mode === "entrega"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
              }`}
            >
              <Bike size={18} className={mode === "entrega" && partnerHasDelivery ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-black text-foreground mt-1">Entrega</p>
              <p className="text-[10px] text-muted-foreground">
                {partnerHasDelivery ? "no endereço" : "indisponível"}
              </p>
            </button>
          </div>

          {!partnerHasDelivery && (
            <div className="flex items-start gap-2 rounded-xl bg-secondary/15 border border-secondary/40 p-3 mt-3">
              <AlertTriangle size={14} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-[11px] font-semibold text-foreground leading-snug">
                Esta loja ainda não trabalha com entrega no app. Apenas retirada disponível.
              </p>
            </div>
          )}
        </div>

        {/* Dados do cliente */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-slide-up">
          <p className="text-xs font-bold text-foreground">Seus dados</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(33) 9..."
                inputMode="tel"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>
          {mode === "entrega" && partnerHasDelivery && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">
                Endereço de entrega
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, ponto de referência..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
          )}
        </div>

        {/* Total */}
        <div className="rounded-2xl bg-accent/40 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase">Total</p>
            <p className="text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "itens"}</p>
          </div>
          <p className="text-2xl font-black text-primary">R${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* CTA fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
        <div className="max-w-sm mx-auto space-y-2">
          <button
            onClick={confirmOrder}
            disabled={submitting}
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] disabled:opacity-60 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
          >
            <Zap size={18} />
            {submitting ? "Enviando..." : "Finalizar pedido"}
          </button>
          {mode === "retirar" && (
            <p className="text-[10px] text-center text-muted-foreground">
              O pedido será enviado direto para a loja via WhatsApp.
            </p>
          )}
          {mode === "entrega" && partnerHasDelivery && (
            <p className="text-[10px] text-center text-muted-foreground">
              O pedido será enviado para entregadores disponíveis no app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
