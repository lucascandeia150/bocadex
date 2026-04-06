import { useState } from "react";
import { getRandomFood } from "@/data/foods";
import type { Food } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { Lightbulb, Shuffle } from "lucide-react";

interface SugestoesPageProps {
  onChoose: (food: Food) => void;
}

export default function SugestoesPage({ onChoose }: SugestoesPageProps) {
  const [suggestion, setSuggestion] = useState<Food>(() => getRandomFood());
  const [key, setKey] = useState(0);

  const newSuggestion = () => {
    const food = getRandomFood(suggestion.id);
    setSuggestion(food);
    onChoose(food);
    setKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col items-center px-4 pt-10 pb-24 gap-6">
      <div className="text-center animate-bounce-in">
        <Lightbulb className="mx-auto text-secondary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Sugestões</h1>
        <p className="text-muted-foreground text-sm mt-1">Deixa o assistente escolher! 🤖</p>
      </div>

      <div className="w-full max-w-sm" key={key}>
        <FoodCard food={suggestion} />
      </div>

      <button
        onClick={newSuggestion}
        className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center gap-2"
      >
        <Shuffle size={22} />
        Outra sugestão
      </button>
    </div>
  );
}
