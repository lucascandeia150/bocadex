import { getCheapFoods } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { Wallet } from "lucide-react";

const economyMessages: Record<string, string> = {
  "arroz-feijao": "Mais barato que fast food e muito mais nutritivo",
  macarrao: "Rende muito e é delicioso",
  salada: "Saudável e cabe no bolso",
  omelete: "Ingredientes simples, resultado incrível",
  sanduiche: "Monte em casa e economize ainda mais",
  marmita: "Economia em relação a fast food",
  pastel: "Rápido e barato, perfeito pro lanche",
  coxinha: "Clássico brasileiro que não pesa no bolso",
  pf: "Refeição completa por um preço justo",
};

export default function EconomicoPage() {
  const cheapFoods = getCheapFoods();

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <Wallet className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Modo Econômico</h1>
        <p className="text-muted-foreground text-sm mt-1">As melhores opções pro seu bolso 💪</p>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        {cheapFoods.map((food, i) => (
          <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <FoodCard
              food={food}
              showReason={false}
              economyMessage={economyMessages[food.id] || food.reason}
              animate={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
