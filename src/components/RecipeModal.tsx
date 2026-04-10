import type { Food } from "@/data/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, DollarSign, ChefHat, Lightbulb, Youtube, ShoppingCart } from "lucide-react";
import { AdBanner } from "./AdBanner";
import { openBuyIngredients, openRecipeVideo } from "@/lib/monetization";

const tips: Record<string, string[]> = {
  "arroz-feijao": ["Use feijão de pacote — mais barato que enlatado", "Cozinhe mais e congele porções para a semana"],
  "macarrao": ["Molho caseiro com tomate fresco sai mais barato", "Substitua queijo ralado por requeijão se preferir"],
  "pizza": ["Massa pronta de mercado economiza tempo", "Use sobras de frios como recheio"],
  "hamburguer": ["Misture pão ralado na carne para render mais", "Substitua alface por repolho — mais barato e crocante"],
  "salada": ["Compre verduras da estação — são mais baratas", "Tempero caseiro de limão e azeite é mais saudável"],
  "omelete": ["Adicione legumes picados para ficar mais nutritivo", "Ovos são uma das proteínas mais baratas"],
  "sanduiche": ["Pão de forma integral rende mais refeições", "Use pasta de atum como alternativa econômica"],
  "marmita": ["Cozinhe no domingo e congele para a semana", "Compre proteína em promoção e congele"],
  "pastel": ["Asse no forno em vez de fritar — mais saudável", "Massa pronta de mercado facilita muito"],
  "acai": ["Compre polpa congelada no atacado — sai mais barato", "Banana dá cremosidade sem custo extra"],
  "coxinha": ["Faça em quantidade e congele antes de empanar", "Use frango de coxa — mais barato e saboroso"],
  "pf": ["Monte com o que tiver na geladeira", "Farofa de manteiga é barata e completa o prato"],
};

const defaultTips = ["Compre ingredientes no atacado para economizar", "Cozinhar em casa sempre sai mais barato que pedir"];

interface RecipeModalProps {
  food: Food;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeModal({ food, open, onOpenChange }: RecipeModalProps) {
  const { recipe } = food;
  const foodTips = tips[food.id] || defaultTips;
  const savings = food.priceMin - recipe.costEstimate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat size={22} className="text-primary" />
            {food.emoji} {food.name}
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
          {savings > 0 && (
            <div className="flex items-center gap-1 bg-secondary/10 rounded-lg px-3 py-1.5 text-sm font-semibold text-secondary">
              💰 -R${savings}
            </div>
          )}
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

          <div className="bg-accent/60 rounded-xl p-3">
            <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb size={16} className="text-secondary" />
              Dicas para economizar
            </h4>
            <ul className="space-y-1.5">
              {foodTips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-secondary mt-0.5">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Monetized buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => openRecipeVideo(food.name)}
              className="flex-1 bg-[hsl(0,72%,51%)]/10 text-[hsl(0,72%,51%)] font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-xs border border-[hsl(0,72%,51%)]/20"
            >
              <Youtube size={16} /> Ver vídeo 🎥
            </button>
            <button
              onClick={() => openBuyIngredients(food.name, recipe.ingredients)}
              className="flex-1 bg-primary/10 text-primary font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-xs border border-primary/20"
            >
              <ShoppingCart size={16} /> Comprar 🛒
            </button>
          </div>

          <AdBanner placement="recipe" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
