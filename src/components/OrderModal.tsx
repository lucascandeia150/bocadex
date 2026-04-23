import type { Food } from "@/data/foods";
import { ProductOrderModal } from "./ProductOrderModal";

interface OrderModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ESCOLHE_AI_WHATSAPP = "5533998669482";

export function OrderModal({ food, open, onOpenChange }: OrderModalProps) {
  return (
    <ProductOrderModal
      open={open}
      onClose={() => onOpenChange(false)}
      storeName="EscolheAí"
      whatsapp={ESCOLHE_AI_WHATSAPP}
      productName={food.name}
      hasDelivery={false}
    />
  );
}