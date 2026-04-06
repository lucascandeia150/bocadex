import type { Food } from "@/data/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, DollarSign, ChefHat } from "lucide-react";

interface RecipeModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeModal({ food, open, onOpenChange }: RecipeModalProps) {
  const { recipe } = food;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat size={22} className="text-primary" />
            Receita: {food.emoji} {food.name}
          </DialogTitle>
          <DialogDescription>Faça em casa e economize!</DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mb-2">
          <div className="flex items-center gap-1 bg-accent rounded-lg px-3 py-1.5 text-sm font-semibold text-accent-foreground">
            <Clock size={14} />
            {recipe.prepTime}
          </div>
          <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary">
            <DollarSign size={14} />
            ~R${recipe.costEstimate}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-foreground mb-2">🛒 Ingredientes</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-2">👨‍🍳 Modo de Preparo</h4>
            <ol className="space-y-2">
              {recipe.steps.map((step, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
