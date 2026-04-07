import { useState, useMemo } from "react";
import { Search, X, Clock, DollarSign, ExternalLink, Globe } from "lucide-react";
import { allItems, type Food } from "@/data/foods";
import { RecipeModal } from "@/components/RecipeModal";

const tagColors: Record<string, string> = {
  econômico: "bg-primary/15 text-primary",
  rápido: "bg-secondary/15 text-secondary",
  leve: "bg-accent text-accent-foreground",
  clássico: "bg-muted text-muted-foreground",
  especial: "bg-destructive/15 text-destructive",
};

const popularSearches = ["pizza", "café", "hambúrguer", "suco", "salada", "açaí"];

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allItems.filter((item) => {
      const name = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const tag = (item.tag || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const type = (item.type || "").toLowerCase();
      return name.includes(q) || tag.includes(q) || type.includes(q);
    });
  }, [query]);

  const handleSelect = (food: Food) => {
    setSelectedFood(food);
    setRecipeOpen(true);
  };

  const handleGoogleSearch = () => {
    window.open(`https://www.google.com/search?q=receita+${encodeURIComponent(query)}`, "_blank");
  };

  const showEmpty = query.trim().length > 0 && results.length === 0;
  const showPopular = query.trim().length === 0;

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="text-center mb-5 animate-bounce-in">
        <Search className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Buscar Receitas</h1>
        <p className="text-muted-foreground text-sm mt-1">Encontre comidas e bebidas 🍽️</p>
      </div>

      {/* Search bar */}
      <div className="max-w-sm mx-auto mb-5 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar comida ou receita... 🍽️"
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90 transition-transform"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Popular searches */}
      {showPopular && (
        <div className="max-w-sm mx-auto mb-4 animate-slide-up">
          <p className="text-xs font-bold text-muted-foreground mb-2">🔥 Buscas populares</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="max-w-sm mx-auto">
          <p className="text-xs text-muted-foreground mb-3">
            {results.length} {results.length === 1 ? "resultado" : "resultados"}
          </p>
          <div className="flex flex-col gap-3">
            {results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="rounded-2xl bg-card border border-border shadow-md p-4 text-left animate-slide-up active:scale-[0.98] transition-transform"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.tag && (
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${tagColors[item.tag] || "bg-muted text-muted-foreground"}`}>
                          {item.tag}
                        </span>
                      )}
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Clock size={10} /> {item.recipe.prepTime}
                      </span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                        <DollarSign size={10} /> R${item.priceMin}–R${item.priceMax} (estimado)
                      </span>
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                        {item.type === "bebida" ? "🥤 Bebida" : "🍽️ Comida"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-primary font-semibold mt-2 text-right">Toque para ver receita →</p>
              </button>
            ))}
          </div>

          {/* Google search button after results */}
          <button
            onClick={handleGoogleSearch}
            className="w-full mt-4 bg-card border border-border rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground active:scale-95 transition-transform"
          >
            <Globe size={16} />
            Buscar "{query}" no Google 🌐
          </button>
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="max-w-sm mx-auto text-center animate-slide-up">
          <span className="text-5xl block mb-3">😕</span>
          <p className="text-foreground font-bold text-lg">Nada encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">Quer buscar no Google?</p>

          <button
            onClick={handleGoogleSearch}
            className="mt-4 gradient-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl active:scale-95 transition-transform inline-flex items-center gap-2"
          >
            <Globe size={18} />
            Buscar "{query}" no Google 🌐
          </button>

          <div className="mt-6">
            <p className="text-xs font-bold text-muted-foreground mb-2">💡 Experimente buscar:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {selectedFood && (
        <RecipeModal food={selectedFood} open={recipeOpen} onOpenChange={setRecipeOpen} />
      )}
    </div>
  );
}
