import { useState } from "react";
import { getRandomItem } from "@/data/foods";
import type { Food } from "@/data/foods";
import { speedLabels } from "@/data/foods";
import { RecipeModal } from "@/components/RecipeModal";
import { Dice5, Shuffle, ChefHat, Clock, DollarSign, Tag } from "lucide-react";

const surprisePhrases = [
  "Que tal isso hoje? 🤔",
  "Sugestão surpresa pra você 👇",
  "Sai da indecisão com isso 😄",
  "Olha o que achei pra você! ✨",
  "Aposta nessa opção! 🎯",
];

export default function DescobrirPage() {
  const [item, setItem] = useState<Food | null>(null);
  const [phrase, setPhrase] = useState("");
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [key, setKey] = useState(0);

  const discover = () => {
    const newItem = getRandomItem(item?.id);
    setItem(newItem);
    setPhrase(surprisePhrases[Math.floor(Math.random() * surprisePhrases.length)]);
    setKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-24 gap-5">
      <div className="text-center animate-bounce-in">
        <Dice5 className="mx-auto text-secondary mb-2" size={36} />
        <h1 className="text-2xl font-black text-foreground">Descoberta Aleatória</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comida ou bebida — deixa o destino escolher! 🎲
        </p>
      </div>

      {!item ? (
        <div className="w-full max-w-xs flex flex-col items-center gap-4 mt-6 animate-slide-up">
          <button
            onClick={discover}
            className="w-full gradient-secondary text-secondary-foreground font-black text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <Dice5 size={24} />
            Escolher algo aleatório 🎲
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Pode sair comida ou bebida — é surpresa!
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm flex flex-col items-center gap-4" key={key}>
          {/* Phrase */}
          <div className="w-full bg-accent/60 rounded-2xl p-3 text-center animate-slide-up">
            <p className="text-sm font-bold text-accent-foreground">{phrase}</p>
          </div>

          {/* Result card */}
          <div className="w-full rounded-2xl bg-card border border-border shadow-lg p-5 animate-bounce-in">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.type === "bebida"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-primary/20 text-primary"
                  }`}>
                    {item.type === "bebida" ? "🥤 Bebida" : "🍽️ Comida"}
                  </span>
                </div>
                <p className="text-lg font-semibold text-primary mt-1">
                  R${item.priceMin} - R${item.priceMax} <span className="text-xs font-normal text-muted-foreground">(estimado)</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-muted text-muted-foreground rounded-lg px-2.5 py-1 flex items-center gap-1">
                    <Clock size={12} /> {item.recipe.prepTime}
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground rounded-lg px-2.5 py-1 flex items-center gap-1">
                    <DollarSign size={12} /> ~R${item.recipe.costEstimate}
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground rounded-lg px-2.5 py-1">
                    {speedLabels[item.speed]}
                  </span>
                  {item.tag && (
                    <span className="text-xs bg-secondary/15 text-secondary rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Tag size={10} /> {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-secondary mt-2">
                  💡 {item.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setRecipeOpen(true)}
              className="flex-1 gradient-primary text-primary-foreground font-bold py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md text-sm"
            >
              <ChefHat size={18} />
              Ver receita
            </button>
            <button
              onClick={discover}
              className="flex-1 bg-muted text-foreground font-bold py-4 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md text-sm"
            >
              <Shuffle size={18} />
              Tentar outra
            </button>
          </div>

          <RecipeModal food={item} open={recipeOpen} onOpenChange={setRecipeOpen} />
        </div>
      )}
    </div>
  );
}
