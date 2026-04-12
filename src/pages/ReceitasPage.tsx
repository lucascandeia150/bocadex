import { useState } from "react";
import { allItems } from "@/data/foods";
import type { Food } from "@/data/foods";
import { RecipeModal } from "@/components/RecipeModal";
import { VideoRecipeCard } from "@/components/VideoRecipeCard";
import { ChefHat, Flame, Zap, DollarSign, Cookie, Wine, Clock, Youtube, Play } from "lucide-react";

type Category = "videos" | "populares" | "rapidos" | "baratos" | "doces" | "bebidas";

const categories: { id: Category; label: string; emoji: string; icon: typeof Flame }[] = [
  { id: "videos", label: "Com vídeo ⭐", emoji: "🎥", icon: Play },
  { id: "populares", label: "Mais procurados", emoji: "🔥", icon: Flame },
  { id: "rapidos", label: "Rápidos e fáceis", emoji: "⚡", icon: Zap },
  { id: "baratos", label: "Baratos do dia a dia", emoji: "💸", icon: DollarSign },
  { id: "doces", label: "Doces e sobremesas", emoji: "🍪", icon: Cookie },
  { id: "bebidas", label: "Bebidas", emoji: "🥤", icon: Wine },
];

function filterByCategory(items: Food[], cat: Category): Food[] {
  switch (cat) {
    case "populares":
      return items.filter((i) => i.recommended);
    case "videos":
      return items.filter((i) => i.recipe.videoUrl);
    case "rapidos":
      return items.filter((i) => i.speed === "rapido");
    case "baratos":
      return items.filter((i) => i.cheap);
    case "doces":
      return items.filter((i) => ["acai", "bolo-cenoura", "brigadeiro", "pudim", "torta-morango", "mousse-maracuja"].includes(i.id));
    case "bebidas":
      return items.filter((i) => i.type === "bebida");
    default:
      return items;
  }
}

export default function ReceitasPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("videos");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const filtered = filterByCategory(allItems, activeCategory);

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="text-center mb-6 animate-bounce-in">
        <ChefHat className="mx-auto text-primary mb-2" size={36} />
        <h1 className="text-2xl font-black text-foreground">Receitas 🍳</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Simples, rápidas e econômicas
        </p>
      </div>

      {/* YouTube Channel Banner */}
      <a
        href="https://www.youtube.com/@escolheai.receitas"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-3.5 mb-5 active:scale-[0.98] transition-transform"
      >
        <Youtube size={28} className="text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">📺 Ver mais receitas no canal</p>
          <p className="text-xs text-muted-foreground">@escolheai.receitas no YouTube</p>
        </div>
        <Play size={18} className="text-destructive shrink-0" />
      </a>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide animate-slide-up">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
              activeCategory === cat.id
                ? "gradient-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-primary/30"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Video section for "videos" category */}
      {activeCategory === "videos" && (
        <div className="flex flex-col gap-4 animate-slide-up mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            🎥 Receitas em vídeo
          </h2>
          {filtered.map((item) => (
            <VideoRecipeCard key={item.id} food={item} />
          ))}
        </div>
      )}

      {/* Regular list for other categories */}
      {activeCategory !== "videos" && (
        <div className="flex flex-col gap-3 animate-slide-up">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => { setSelectedFood(item); setRecipeOpen(true); }}
              className="w-full bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm active:scale-[0.98] transition-transform hover:border-primary/30 text-left group"
            >
              <span className="text-4xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{item.reason}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-foreground font-semibold flex items-center gap-1">
                    <Clock size={12} className="text-primary" />
                    {item.recipe.prepTime}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign size={12} />
                    ~R${item.recipe.costEstimate}
                  </span>
                  {item.recipe.videoUrl && (
                    <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                      <Play size={10} />
                      Vídeo
                    </span>
                  )}
                </div>
              </div>
              <ChefHat size={16} className="text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <ChefHat size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma receita nessa categoria ainda 😕</p>
        </div>
      )}

      {selectedFood && (
        <RecipeModal food={selectedFood} open={recipeOpen} onOpenChange={setRecipeOpen} />
      )}
    </div>
  );
}
