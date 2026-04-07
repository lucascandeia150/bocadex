import type { Food } from "@/data/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Truck } from "lucide-react";

interface OrderModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModal({ food, open, onOpenChange }: OrderModalProps) {
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
          <span className="text-4xl block mb-3">😕</span>
          <p className="text-foreground font-bold text-lg">
            Ainda não temos restaurantes parceiros disponíveis
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Em breve você poderá pedir direto pelo app! 🚀
          </p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="w-full bg-muted text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Entendi
        </button>
      </DialogContent>
    </Dialog>
  );
}
