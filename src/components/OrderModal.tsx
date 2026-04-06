import type { Food } from "@/data/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Truck, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface OrderModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModal({ food, open, onOpenChange }: OrderModalProps) {
  const { delivery } = food;

  const handleOrder = () => {
    toast.success(`Redirecionando para o ${delivery.platform}...`, {
      description: `Pedido de ${food.name} — entrega estimada: ${delivery.estimatedTime}`,
    });
    onOpenChange(false);
  };

  if (!delivery.available) {
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
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">😅</span>
            <p className="text-muted-foreground font-medium">
              Essa opção é melhor fazer em casa!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Veja a receita — é rápido e fácil.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck size={22} className="text-secondary" />
            Pedir {food.emoji} {food.name}
          </DialogTitle>
          <DialogDescription>Peça agora pelo {delivery.platform}</DialogDescription>
        </DialogHeader>

        <div className="bg-secondary/10 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-secondary">
            ✅ Disponível no {delivery.platform}
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-muted-foreground text-sm">
            <Clock size={14} />
            Entrega em {delivery.estimatedTime}
          </div>
          <p className="text-lg font-bold text-foreground mt-2">
            R${food.priceMin} - R${food.priceMax}
          </p>
        </div>

        <button
          onClick={handleOrder}
          className="w-full gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <ExternalLink size={20} />
          Abrir {delivery.platform}
        </button>
      </DialogContent>
    </Dialog>
  );
}
