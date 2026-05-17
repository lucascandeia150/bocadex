import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartItem } from "@/contexts/CartContext";

interface ProductOrderModalProps {
  open: boolean;
  onClose: () => void;
  partnerId: string;
  storeName: string;
  whatsapp: string;
  productName: string;
  productId?: string;
  unitPrice?: number | null;
  hasDelivery: boolean;
  onSent?: () => void;
}

export function ProductOrderModal({
  open,
  onClose,
  partnerId,
  storeName,
  whatsapp,
  productName,
  productId,
  unitPrice,
  hasDelivery,
  onSent,
}: ProductOrderModalProps) {
  const { addItem, forceAddItem, partnerId: cartPartnerId, partnerName: cartPartnerName } = useCart();
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [conflict, setConflict] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setQty(1);
      setNotes("");
      setConflict(false);
      setAdding(false);
      setDragY(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const price = unitPrice ?? 0;
  const total = price * qty;
  const pid = productId ?? `${partnerId}:${productName}`;

  const buildItem = (): CartItem => ({
    productId: pid,
    name: productName,
    unitPrice: price,
    quantity: qty,
    notes: notes.trim() || undefined,
    partnerId,
    partnerName: storeName,
    partnerWhatsapp: whatsapp,
    partnerHasDelivery: hasDelivery,
  });

  const handleAdd = () => {
    if (adding) return;
    setAdding(true);
    const result = addItem(buildItem());
    if (result.replacedPartner) {
      setConflict(true);
      setAdding(false);
      return;
    }
    setTimeout(() => {
      toast.success(`${qty}x ${productName} adicionado 🛒`);
      onSent?.();
      setAdding(false);
      onClose();
    }, 180);
  };

  const handleReplace = () => {
    forceAddItem(buildItem());
    toast.success("Carrinho atualizado com a nova loja 🛒");
    onSent?.();
    onClose();
  };

  // Swipe-to-close (mobile)
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 120) onClose();
    setDragY(0);
    startY.current = null;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] isolate bg-black/60 no-blur flex items-end sm:items-center justify-center p-0 sm:p-4 android-stable-layer"
      onClick={onClose}
    >
      <div
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined, transition: dragY === 0 ? "transform 0.2s ease" : "none" }}
        className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div
          className="sm:hidden pt-2 pb-1 flex justify-center shrink-0 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 sm:pt-5 pb-2 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wide">Adicionar ao carrinho</p>
            <h2 className="text-lg font-black text-foreground leading-tight truncate">{productName}</h2>
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

        <div className="px-5 pt-3 pb-4 space-y-4 overflow-y-auto flex-1">
          {conflict ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-secondary/15 border border-secondary/40 p-3">
                <AlertTriangle size={16} className="text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Carrinho com outra loja</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Você já tem itens de <span className="font-bold">{cartPartnerName}</span>. Quer
                    esvaziar e começar um novo carrinho com <span className="font-bold">{storeName}</span>?
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConflict(false)}
                  className="rounded-2xl border-2 border-border bg-background py-3 text-xs font-bold active:scale-95 transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReplace}
                  className="rounded-2xl bg-destructive text-destructive-foreground py-3 text-xs font-bold active:scale-95 transition-transform"
                >
                  Esvaziar e adicionar
                </button>
              </div>
            </div>
          ) : (
            <>
              {price > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Preço</span>
                  <span className="text-lg font-black text-primary">R${price.toFixed(2)}</span>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-foreground mb-2">Quantidade</p>
                <div className="flex items-center gap-3 bg-muted/30 rounded-2xl p-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 shadow-sm"
                    aria-label="Diminuir"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="flex-1 text-center">
                    <p className="text-3xl font-black text-foreground leading-none">{qty}</p>
                    {total > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1">Subtotal: R${total.toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setQty(Math.min(20, qty + 1))}
                    disabled={qty >= 20}
                    className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 shadow-sm"
                    aria-label="Aumentar"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  Observação <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: sem cebola, bem gelado..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
                />
              </div>

              {!hasDelivery && (
                <div className="flex items-start gap-2 rounded-xl bg-muted/40 border border-border p-2.5">
                  <AlertTriangle size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Esta loja só trabalha com retirada no local.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky CTA */}
        {!conflict && (
          <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-card shrink-0">
            <button
              onClick={handleAdd}
              disabled={adding}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-black py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              {adding ? "Adicionando..." : total > 0 ? `Adicionar · R$${total.toFixed(2)}` : "Adicionar ao carrinho"}
            </button>
            {cartPartnerId && cartPartnerId === partnerId && (
              <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                Você já tem itens desta loja no carrinho.
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
