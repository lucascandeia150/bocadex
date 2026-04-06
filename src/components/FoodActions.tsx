import { useState } from "react";
import type { Food } from "@/data/foods";
import { RecipeModal } from "./RecipeModal";
import { OrderModal } from "./OrderModal";
import { ChefHat, Truck } from "lucide-react";

interface FoodActionsProps {
  food: Food;
  smartTip?: string;
}

export function FoodActions({ food, smartTip }: FoodActionsProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <>
      {smartTip && (
        <div className="w-full bg-accent/60 rounded-xl p-3 text-center mb-1">
          <p className="text-sm font-semibold text-accent-foreground">{smartTip}</p>
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          onClick={() => setRecipeOpen(true)}
          className="flex-1 gradient-primary text-primary-foreground font-bold py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
        >
          <ChefHat size={18} />
          Fazer em casa
        </button>
        <button
          onClick={() => setOrderOpen(true)}
          className="flex-1 gradient-secondary text-secondary-foreground font-bold py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
        >
          <Truck size={18} />
          Pedir agora
        </button>
      </div>

      <RecipeModal food={food} open={recipeOpen} onOpenChange={setRecipeOpen} />
      <OrderModal food={food} open={orderOpen} onOpenChange={setOrderOpen} />
    </>
  );
}
