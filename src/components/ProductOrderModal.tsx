import { useState } from "react";
import { X, MessageCircle, Package, Bike, AlertTriangle } from "lucide-react";

interface ProductOrderModalProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  whatsapp: string;
  productName: string;
  hasDelivery: boolean;
  onSent?: () => void;
}

type Mode = "retirar" | "entrega";

export function ProductOrderModal({ open, onClose, storeName, whatsapp, productName, hasDelivery, onSent }: ProductOrderModalProps) {
  const [mode, setMode] = useState<Mode>(hasDelivery ? "entrega" : "retirar");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");

  if (!open) return null;

  const send = () => {
    const lines = [
      `Olá, ${storeName}! 👋`,
      ``,
      `Quero fazer um pedido pelo EscolheAí:`,
      `🛍️ Produto: ${productName}`,
      `📦 Tipo: ${mode === "retirar" ? "Retirar na loja" : "Solicitar entrega"}`,
    ];
    if (name.trim()) lines.push(`👤 Nome: ${name.trim()}`);
    if (mode === "entrega" && address.trim()) lines.push(`📍 Endereço: ${address.trim()}`);
    lines.push(``, `Pode confirmar? 😄`);

    const phone = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
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

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Seu nome (opcional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
            />
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

          <button
            onClick={send}
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <MessageCircle size={18} />
            Enviar pedido pelo WhatsApp
          </button>
          <p className="text-[10px] text-center text-muted-foreground">
            O pedido será enviado direto para a loja via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}