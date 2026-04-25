import { useEffect, useState } from "react";
import { X, Minus, Plus, ShoppingCart, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      setQty(1);
      setNotes("");
      setConflict(false);
    }
  }, [open]);

  if (!open) return null;

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
    const result = addItem(buildItem());
    if (result.replacedPartner) {
      setConflict(true);
      return;
    }
    toast.success(`${qty}x ${productName} adicionado ao carrinho 🛒`);
    onSent?.();
    onClose();
  };

  const handleReplace = () => {
    forceAddItem(buildItem());
    toast.success("Carrinho atualizado com a nova loja 🛒");
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

        <div className="px-5 pt-3 pb-5 space-y-4">
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
              {/* Preço */}
              {price > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Preço</span>
                  <span className="text-lg font-black text-primary">R${price.toFixed(2)}</span>
                </div>
              )}

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
                    {total > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-1">Subtotal: R${total.toFixed(2)}</p>
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

              {/* Observação */}
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

              <button
                onClick={handleAdd}
                className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <ShoppingCart size={18} />
                Adicionar ao carrinho
              </button>
              {cartPartnerId && cartPartnerId === partnerId && (
                <p className="text-[10px] text-center text-muted-foreground">
                  Você já tem itens desta loja no carrinho.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
