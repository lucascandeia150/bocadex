import type { Food } from "@/data/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Truck, MessageCircle } from "lucide-react";

interface OrderModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModal({ food, open, onOpenChange }: OrderModalProps) {
  const hasWhatsApp = food.delivery?.available && food.delivery?.whatsapp;

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Vim pelo app EscolheAí e quero pedir ${food.name} 😄`
    );
    const url = `https://wa.me/${food.delivery.whatsapp}?text=${message}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck size={22} className="text-secondary" />
            Pedir {food.emoji} {food.name}
          </DialogTitle>
          <DialogDescription>Opção de entrega</DialogDescription>
        </DialogHeader>

        {hasWhatsApp ? (
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">{food.emoji}</span>
            <p className="text-foreground font-bold text-lg">{food.name}</p>
            {food.tag === "parceiro" && (
              <span className="inline-block mt-2 text-xs font-bold bg-secondary/20 text-secondary px-3 py-1 rounded-full">
                🔥 Parceiro local
              </span>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              R${food.priceMin} - R${food.priceMax} (estimado)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ⏱️ {food.delivery.estimatedTime}
            </p>

            <button
              onClick={openWhatsApp}
              className="w-full mt-5 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <MessageCircle size={20} />
              Pedir pelo WhatsApp 🍪
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">😕</span>
            <p className="text-foreground font-bold text-lg">
              Ainda não temos restaurantes parceiros disponíveis
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve você poderá pedir direto pelo app! 🚀
            </p>
          </div>
        )}

        <button
          onClick={() => onOpenChange(false)}
          className="w-full bg-muted text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          {hasWhatsApp ? "Fechar" : "Entendi"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
