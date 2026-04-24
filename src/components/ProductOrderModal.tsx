import { useState } from "react";
import { X, MessageCircle, Package, Bike, AlertTriangle, Minus, Plus, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductOrderModalProps {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  storeName: string;
  whatsapp: string;
  productName: string;
  unitPrice?: number | null;
  hasDelivery: boolean;
  onSent?: () => void;
}

type Mode = "retirar" | "entrega";

export function ProductOrderModal({ open, onClose, partnerId, storeName, whatsapp, productName, unitPrice, hasDelivery, onSent }: ProductOrderModalProps) {
  const [mode, setMode] = useState<Mode>(hasDelivery ? "entrega" : "retirar");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const totalValue = unitPrice ? unitPrice * qty : 0;

  const buildWaMessage = (extra?: string) => {
    const lines = [
      `Olá, ${storeName}! 👋`,
      ``,
      `Quero fazer um pedido pelo EscolheAí:`,
      `🛍️ Produto: ${productName} (x${qty})`,
      `📦 Tipo: ${mode === "retirar" ? "Retirar na loja" : "Solicitar entrega"}`,
    ];
    if (totalValue > 0) lines.push(`💰 Total estimado: R$${totalValue.toFixed(2)}`);
    if (name.trim()) lines.push(`👤 Nome: ${name.trim()}`);
    if (phone.trim()) lines.push(`📞 Telefone: ${phone.trim()}`);
    if (mode === "entrega" && address.trim()) lines.push(`📍 Endereço: ${address.trim()}`);
    if (extra) lines.push(``, extra);
    lines.push(``, `Pode confirmar? 😄`);
    return lines.join("\n");
  };

  const openWa = (msg: string) => {
    const phone = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendWhatsAppOnly = () => {
    openWa(buildWaMessage());
    onSent?.();
    onClose();
  };

  const sendOrderApp = async () => {
    if (mode === "entrega" && !address.trim()) {
      toast.error("Informe o endereço de entrega");
      return;
    }
    if (mode !== "entrega" || !hasDelivery) {
      // sem entregador do app — fallback WhatsApp
      sendWhatsAppOnly();
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("customer_create_delivery", {
      _partner_id: partnerId,
      _order_description: `${productName} (x${qty})`,
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
    // Avisa a loja via WhatsApp também
    openWa(buildWaMessage("✅ Pedido criado no app — entregador a caminho."));
    onSent?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <p className="text-[11px] font-bold text-primary uppercase tracking-wide">Novo pedido</p>
            <h2 className="text-lg font-black text-foreground leading-tight">{productName}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{storeName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-muted text-muted-foreground active:scale-90 transition-transform"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pt-3 pb-5 space-y-4">
          {/* Quantidade */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2">Quantidade</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Diminuir"
              >
                <Minus size={16} />
              </button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-black text-foreground leading-none">{qty}</p>
                {totalValue > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">Total: R${totalValue.toFixed(2)}</p>
                )}
              </div>
              <button
                onClick={() => setQty(Math.min(20, qty + 1))}
                className="w-10 h-10 rounded-xl border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                aria-label="Aumentar"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2">Como você quer receber?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("retirar")}
                className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                  mode === "retirar"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                <Package size={18} className={mode === "retirar" ? "text-primary" : "text-muted-foreground"} />
                <p className="text-xs font-black text-foreground mt-1">Retirar</p>
                <p className="text-[10px] text-muted-foreground">na loja</p>
              </button>
              <button
                onClick={() => hasDelivery && setMode("entrega")}
                disabled={!hasDelivery}
                className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                  !hasDelivery
                    ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                    : mode === "entrega"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background"
                }`}
              >
                <Bike size={18} className={mode === "entrega" && hasDelivery ? "text-primary" : "text-muted-foreground"} />
                <p className="text-xs font-black text-foreground mt-1">Entrega</p>
                <p className="text-[10px] text-muted-foreground">
                  {hasDelivery ? "no endereço" : "indisponível"}
                </p>
              </button>
            </div>
          </div>

          {!hasDelivery && (
            <div className="flex items-start gap-2 rounded-xl bg-secondary/15 border border-secondary/40 p-3">
              <AlertTriangle size={14} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-[11px] font-semibold text-foreground leading-snug">
                Ainda não trabalhamos com entrega. Retirada disponível.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Seu nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(33) 9..."
                inputMode="tel"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>

          {mode === "entrega" && hasDelivery && (
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Endereço de entrega</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, ponto de referência..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={sendOrderApp}
              disabled={submitting}
              className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] disabled:opacity-60 text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <Zap size={18} />
              {submitting ? "Enviando..." : "Pedir agora"}
            </button>
            <button
              onClick={sendWhatsAppOnly}
              className="w-full bg-background border-2 border-border text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <MessageCircle size={14} />
              Falar com a loja no WhatsApp
            </button>
            <p className="text-[10px] text-center text-muted-foreground">
              {mode === "entrega" && hasDelivery
                ? "O pedido será enviado para entregadores disponíveis."
                : "O pedido será enviado direto para a loja."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}