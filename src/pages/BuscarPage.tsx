import { useState, useMemo } from "react";
import { Search, X, Clock, DollarSign, Sparkles, RotateCcw, ArrowLeft, Bookmark, Loader2, ChefHat, Lightbulb } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { allItems, type Food } from "@/data/foods";
import { RecipeModal } from "@/components/RecipeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PartnerBanner } from "@/components/PartnerBanner";

const tagColors: Record<string, string> = {
  econômico: "bg-primary/15 text-primary",
  rápido: "bg-secondary/15 text-secondary",
  leve: "bg-accent text-accent-foreground",
  clássico: "bg-muted text-muted-foreground",
  especial: "bg-destructive/15 text-destructive",
  parceiro: "bg-secondary/20 text-secondary",
};

const popularSearches = ["pizza", "café", "hambúrguer", "suco", "salada", "açaí", "arroz à grega", "bolo de cenoura", "strogonoff"];

interface AIRecipe {
  name: string;
  emoji: string;
  prepTime: string;
  costEstimate: number;
  priceMin: number;
  priceMax: number;
  tag: string;
  reason: string;
  ingredients: string[];
  steps: string[];
  tips: string[];
}

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [aiRecipe, setAiRecipe] = useState<AIRecipe | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const generateAIRecipe = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setAiLoading(true);
    setAiRecipe(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { query: q.trim() },
      });

      if (error) {
        throw new Error(error.message || "Erro ao gerar receita");
      }

      if (data?.error) {
        toast({ title: "Ops!", description: data.error, variant: "destructive" });
        return;
      }

      if (data?.recipe) {
        setAiRecipe(data.recipe);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a receita. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    toast({ title: "Receita salva! 📌", description: "Em breve você poderá acessar suas receitas salvas." });
  };

  const showEmpty = query.trim().length > 0 && results.length === 0 && !aiRecipe && !aiLoading;
  const showPopular = query.trim().length === 0 && !aiRecipe;

  return (
    <div className="px-4 pt-6 pb-10">
      <BackButton />
      {/* Header */}
      <div className="text-center mb-5 animate-bounce-in">
        <Search className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Buscar Receitas</h1>
        <p className="text-muted-foreground text-sm mt-1">Encontre ou crie receitas com IA 🍽️✨</p>
      </div>

      {/* Search bar */}
      <div className="max-w-sm mx-auto mb-5 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiRecipe(null); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && results.length === 0) {
                generateAIRecipe();
              }
            }}
            placeholder="Buscar comida ou receita... 🍽️"
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setAiRecipe(null); }}
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

          <div className="mt-5">
            <PartnerBanner />
          </div>
        </div>
      )}

      {/* Internal Results */}
      {results.length > 0 && !aiRecipe && (
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
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-primary font-semibold mt-2 text-right">Toque para ver receita →</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Loading */}
      {aiLoading && (
        <div className="max-w-sm mx-auto text-center animate-slide-up py-10">
          <Loader2 className="mx-auto text-primary mb-4 animate-spin" size={40} />
          <p className="text-foreground font-bold text-lg">Criando receita com IA... 🤖</p>
          <p className="text-sm text-muted-foreground mt-2">Gerando uma receita personalizada para "{query}"</p>
        </div>
      )}

      {/* AI Generated Recipe */}
      {aiRecipe && !aiLoading && (
        <div className="max-w-sm mx-auto animate-slide-up">
          <div className="bg-secondary/10 rounded-xl p-3 text-center mb-4">
            <p className="text-sm font-semibold text-secondary flex items-center justify-center gap-1.5">
              <Sparkles size={16} />
              Não encontramos isso pronto, mas criamos uma receita pra você 👇
            </p>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
            <div className="text-center mb-4">
              <span className="text-5xl block mb-2">{aiRecipe.emoji}</span>
              <h3 className="text-xl font-black text-foreground">{aiRecipe.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{aiRecipe.reason}</p>
            </div>

            <div className="flex gap-2 justify-center mb-4 flex-wrap">
              {aiRecipe.tag && (
                <span className={`text-[11px] font-bold rounded-full px-3 py-1 ${tagColors[aiRecipe.tag] || "bg-muted text-muted-foreground"}`}>
                  {aiRecipe.tag}
                </span>
              )}
              <span className="text-[11px] bg-muted text-muted-foreground rounded-full px-3 py-1 flex items-center gap-1">
                <Clock size={12} /> {aiRecipe.prepTime}
              </span>
              <span className="text-[11px] bg-primary/10 text-primary font-semibold rounded-full px-3 py-1 flex items-center gap-1">
                <DollarSign size={12} /> R${aiRecipe.priceMin}–R${aiRecipe.priceMax} (estimado)
              </span>
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                <ChefHat size={16} className="text-primary" />
                🛒 Ingredientes
              </h4>
              <ul className="space-y-1">
                {aiRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="mb-4">
              <h4 className="font-bold text-foreground mb-2">👨‍🍳 Modo de Preparo</h4>
              <ol className="space-y-2">
                {aiRecipe.steps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {aiRecipe.tips && aiRecipe.tips.length > 0 && (
              <div className="bg-accent/60 rounded-xl p-3">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Lightbulb size={16} className="text-secondary" />
                  Dicas para economizar
                </h4>
                <ul className="space-y-1.5">
                  {aiRecipe.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-secondary mt-0.5">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => generateAIRecipe()}
              className="w-full gradient-secondary text-secondary-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Gerar outra versão
            </button>
            <button
              onClick={handleSave}
              disabled={saved}
              className={`w-full font-bold py-3 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                saved
                  ? "bg-primary/20 text-primary"
                  : "gradient-primary text-primary-foreground"
              }`}
            >
              <Bookmark size={18} />
              {saved ? "Receita salva! ✅" : "Salvar receita 📌"}
            </button>
            <button
              onClick={() => { setAiRecipe(null); setQuery(""); }}
              className="w-full bg-muted text-muted-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* Empty state — auto-generate */}
      {showEmpty && (
        <div className="max-w-sm mx-auto text-center animate-slide-up">
          <span className="text-5xl block mb-3">🤖</span>
          <p className="text-foreground font-bold text-lg">Não encontramos "{query}" na base</p>
          <p className="text-sm text-muted-foreground mt-2">
            Mas nossa IA pode criar uma receita pra você!
          </p>

          <button
            onClick={() => generateAIRecipe()}
            className="mt-4 gradient-primary text-primary-foreground font-bold py-3.5 px-6 rounded-2xl active:scale-95 transition-transform inline-flex items-center gap-2 shadow-lg"
          >
            <Sparkles size={18} />
            Gerar receita com IA ✨
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

      {/* Recipe Modal for internal items */}
      {selectedFood && (
        <RecipeModal food={selectedFood} open={recipeOpen} onOpenChange={setRecipeOpen} />
      )}
    </div>
  );
}
