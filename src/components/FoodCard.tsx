import type { Food } from "@/data/foods";
import { speedLabels } from "@/data/foods";

interface FoodCardProps {
  food: Food;
  showReason?: boolean;
  economyMessage?: string;
  animate?: boolean;
}

export function FoodCard({ food, showReason = true, economyMessage, animate = true }: FoodCardProps) {
  return (
    <div className={`rounded-2xl bg-card p-5 shadow-lg border border-border ${animate ? "animate-bounce-in" : ""}`}>
      <div className="flex items-start gap-4">
        <span className="text-5xl">{food.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-foreground">{food.name}</h3>
          <p className="text-lg font-semibold text-primary mt-1">
            R${food.priceMin} - R${food.priceMax}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{speedLabels[food.speed]}</p>
          {showReason && (
            <p className="text-sm font-medium text-secondary mt-2 bg-secondary/10 rounded-lg px-3 py-1.5 inline-block">
              💡 {food.reason}
            </p>
          )}
          {economyMessage && (
            <p className="text-sm font-medium text-primary mt-2 bg-accent rounded-lg px-3 py-1.5 inline-block">
              💰 {economyMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
