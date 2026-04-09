import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Star, Mail, Sparkles, Zap, ArrowRight, Shuffle, X, Clock, DollarSign, ChefHat, Wine, Plus, Beer, UtensilsCrossed } from "lucide-react";
import { getRandomFood, getPairedDrink, getComboPhrase, getDrinkContextPhrase, getRandomDrink, allItems, drinks } from "@/data/foods";
import type { Food } from "@/data/foods";
import { FoodActions } from "@/components/FoodActions";
import { PartnerBanner } from "@/components/PartnerBanner";
import { RecipeModal } from "@/components/RecipeModal";
import logo from "@/assets/logo.png";
import { RotateCcw, MessageCircle } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { stores } from "@/data/stores";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

type Step = "home" | "choose-type" | "result";
type SuggestionMode = "comida" | "bebida" | "combo";

const drinkPhrases = [
  "Que tal essa bebida? 🍹",
  "Perfeita pra agora! 🥤",
  "Bora de drinks! 🍸",
  "Refrescante e saborosa! ☀️",
  "Boa pedida! 🍺",
];

export default function HomePage({ onChoose }: HomePageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("home");
  const [mode, setMode] = useState<SuggestionMode>("combo");
  const [result, setResult] = useState<Food | null>(null);
  const [pairedDrink, setPairedDrink] = useState<Food | null>(null);
  const [drinkPhrase, setDrinkPhrase] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [smartTip, setSmartTip] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const searchResults = searchQuery.trim()
    ? allItems.filter((item) => {
        const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const name = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return name.includes(q);
      }).slice(0, 5)
    : [];

  const reset = () => { setStep("home"); setResult(null); setPairedDrink(null); setPersonalMessage(""); setSmartTip(""); setDrinkPhrase(""); };

  const generateSuggestion = (selectedMode: SuggestionMode, excludeId?: string) => {
    setMode(selectedMode);

    if (selectedMode === "comida") {
      const food = getRandomFood(excludeId);
      setResult(food); setPairedDrink(null);
      setPersonalMessage("Boa escolha pra hoje! 🎯");
      setSmartTip(`💡 Fazendo em casa sai por ~R$${food.recipe.costEstimate}!`);
      setDrinkPhrase("");
      onChoose(food);
    } else if (selectedMode === "bebida") {
      const drink = getRandomDrink(excludeId);
      setResult(drink); setPairedDrink(null);
      setPersonalMessage(drinkPhrases[Math.floor(Math.random() * drinkPhrases.length)]);
      setSmartTip(`💡 Custo em casa: ~R$${drink.recipe.costEstimate}`);
      setDrinkPhrase("");
      onChoose(drink);
    } else {
      const food = getRandomFood(excludeId);
      const drink = getPairedDrink(food);
      setResult(food); setPairedDrink(drink);
      setPersonalMessage(getComboPhrase());
      setSmartTip(`💡 Combo em casa: ~R$${food.recipe.costEstimate + drink.recipe.costEstimate}!`);
      setDrinkPhrase(getDrinkContextPhrase());
      onChoose(food);
    }

    setStep("result");

    // Track suggestion
    const foodName = selectedMode === "bebida" ? undefined : selectedMode === "comida" ? undefined : undefined;
    trackAnalyticsEvent("suggestion_generated", { mode: selectedMode });
  };

  const outraOpcao = () => {
    generateSuggestion(mode, result?.id);
  };

  const decidirPorMim = () => {
    const modes: SuggestionMode[] = ["comida", "bebida", "combo"];
    generateSuggestion(modes[Math.floor(Math.random() * modes.length)]);
  };

  // Choose type screen
  if (step === "choose-type") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8">
        <div className="text-center animate-bounce-in">
          <span className="text-5xl block mb-3">🤔</span>
          <h2 className="text-2xl font-black text-foreground">O que você prefere agora?</h2>
          <p className="text-muted-foreground text-sm mt-2">Escolha e a gente sugere!</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up">
          <button onClick={() => generateSuggestion("comida")}
            className="gradient-primary text-primary-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
            <UtensilsCrossed size={24} /> Comida 🍽️
          </button>
          <button onClick={() => generateSuggestion("bebida")}
            className="gradient-secondary text-secondary-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
            <Beer size={24} /> Bebida 🍺
          </button>
          <button onClick={() => generateSuggestion("combo")}
            className="bg-card border-2 border-primary text-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3">
            <Plus size={24} className="text-primary" /> Combo 🍔🍺
          </button>
        </div>

        <button onClick={reset} className="text-muted-foreground text-sm underline mt-2">Voltar ao início</button>
      </div>
    );
  }

  // Result screen
  if (step === "result" && result) {
    return (
      <ResultScreen
        result={result}
        pairedDrink={pairedDrink}
        drinkPhrase={drinkPhrase}
        personalMessage={personalMessage}
        smartTip={smartTip}
        mode={mode}
        onOutraOpcao={outraOpcao}
        onReset={reset}
      />
    );
  }

  // Home screen
  return (
    <div className="px-4 pt-10 pb-12">
      {/* Hero */}
      <div className="text-center mb-8 animate-bounce-in">
        <div className="w-28 h-28 mx-auto mb-4 rounded-3xl bg-card shadow-xl border border-border/50 flex items-center justify-center p-2">
          <img src={logo} alt="EscolheAí" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-[1.6rem] font-black text-foreground leading-snug tracking-tight">
          Sem ideia do que comer<br />ou beber? 🤔
        </h1>
        <p className="text-secondary font-extrabold text-base mt-2">
          A gente escolhe por você 🍽️
        </p>
      </div>

      {/* Search */}
      <div className="max-w-sm mx-auto mb-8 animate-slide-up relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Buscar comida ou receita... 🔍"
            className="w-full bg-card border border-border rounded-2xl py-4 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={18} /></button>
          )}
        </div>
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {searchResults.map((item) => (
              <button key={item.id} onMouseDown={() => { setSelectedFood(item); setRecipeOpen(true); setSearchQuery(""); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock size={10} />{item.recipe.prepTime}</span>
                    <span className="flex items-center gap-0.5"><DollarSign size={10} />R${item.priceMin}–{item.priceMax}</span>
                  </div>
                </div>
                <ChefHat size={14} className="text-primary shrink-0" />
              </button>
            ))}
            <button onMouseDown={() => navigate("/buscar")} className="w-full text-center px-4 py-2.5 text-xs font-bold text-primary hover:bg-accent/50 transition-colors">
              Ver todos os resultados →
            </button>
          </div>
        )}
        {searchFocused && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Nada encontrado 😕</p>
            <button onMouseDown={() => navigate("/buscar")} className="mt-2 text-xs font-bold text-primary">Buscar com IA na aba Buscar →</button>
          </div>
        )}
      </div>

      {/* CTA principal */}
      <div className="max-w-sm mx-auto flex flex-col gap-3 mb-10 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <button onClick={() => setStep("choose-type")}
          className="gradient-primary text-primary-foreground font-black text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Zap size={22} /> Decidir agora <ArrowRight size={18} />
        </button>
        <button onClick={decidirPorMim}
          className="gradient-secondary text-secondary-foreground font-bold text-base py-4 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Shuffle size={20} /> Surpresa! Escolhe pra mim
        </button>
      </div>

      {/* Destaques */}
      <div className="max-w-sm mx-auto mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={20} className="text-secondary" /> Destaques do dia 🔥
        </h2>
        <PartnerBanner />
      </div>

      {/* Navegação */}
      <div className="max-w-sm mx-auto animate-slide-up" style={{ animationDelay: "150ms" }}>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Explorar</h2>
        <div className="flex flex-col gap-3">
          <NavButton icon={<ShoppingBag size={22} />} label="Explorar Lojas" emoji="🛍️" onClick={() => navigate("/lojas")} />
          <NavButton icon={<Wine size={22} />} label="Bebidas & Drinks" emoji="🍹" onClick={() => navigate("/bebidas")} />
          <NavButton icon={<Search size={22} />} label="Buscar Receitas" emoji="🔍" onClick={() => navigate("/buscar")} />
        </div>

        <div className="flex gap-3 mt-3">
          <button onClick={() => navigate("/contato")}
            className="flex-1 bg-card border border-border rounded-2xl px-4 py-4 flex flex-col items-center gap-1 shadow-sm active:scale-[0.97] transition-transform hover:border-primary/30">
            <Mail size={20} className="text-primary" />
            <span className="text-xs font-bold text-foreground">Contato 📩</span>
          </button>
          <button onClick={() => navigate("/avaliar")}
            className="flex-1 bg-card border border-border rounded-2xl px-4 py-4 flex flex-col items-center gap-1 shadow-sm active:scale-[0.97] transition-transform hover:border-secondary/30">
            <Star size={20} className="text-secondary" />
            <span className="text-xs font-bold text-foreground">Avaliar ⭐</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-12">
        © 2026 EscolheAí — Feito com ❤️
      </p>

      {selectedFood && <RecipeModal food={selectedFood} open={recipeOpen} onOpenChange={setRecipeOpen} />}
    </div>
  );
}

function NavButton({ icon, label, emoji, onClick }: { icon: React.ReactNode; label: string; emoji: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm active:scale-[0.97] transition-transform hover:border-primary/30 text-left group">
      <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-base font-bold text-foreground flex-1">{label} {emoji}</span>
      <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function ResultScreen({ result, pairedDrink, drinkPhrase, personalMessage, smartTip, mode, onOutraOpcao, onReset }: {
  result: Food; pairedDrink: Food | null; drinkPhrase: string; personalMessage: string; smartTip: string; mode: SuggestionMode; onOutraOpcao: () => void; onReset: () => void;
}) {
  const navigate = useNavigate();
  const [drinkRecipeOpen, setDrinkRecipeOpen] = useState(false);
  const [foodRecipeOpen, setFoodRecipeOpen] = useState(false);

  const isBebidaOnly = mode === "bebida";
  const isCombo = mode === "combo" && pairedDrink;

  // Determine partner store based on suggestion type
  const getPartnerStore = () => {
    if (isBebidaOnly || result.tag === "parceiro" && result.type === "bebida") {
      return stores.find(s => s.id === "e-pra-ja");
    }
    if (result.id === "biscoito-nata" || result.tag === "parceiro") {
      return stores.find(s => s.id === "biscoito-da-tete");
    }
    // For combos, show drink partner
    return null;
  };

  const getDrinkPartner = () => stores.find(s => s.id === "e-pra-ja");
  const getFoodPartner = () => {
    if (result.id === "biscoito-nata") return stores.find(s => s.id === "biscoito-da-tete");
    return null;
  };

  const mainPartner = getPartnerStore();
  const drinkPartner = isCombo ? getDrinkPartner() : null;
  const foodPartner = !isBebidaOnly ? getFoodPartner() : null;

  const openWhatsApp = (phone: string, message: string) => {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center px-6 pt-6 pb-10 gap-4">
      <div className="text-center animate-bounce-in">
        <Sparkles className="mx-auto text-secondary mb-1" size={26} />
        <h2 className="text-xl font-black text-foreground">
          {isBebidaOnly ? "Sua bebida perfeita! 🍹" : isCombo ? "Combo perfeito! 🍔🍺" : "Sua escolha perfeita!"}
        </h2>
      </div>
      <div className="w-full max-w-sm bg-accent/50 rounded-2xl p-4 text-center animate-slide-up">
        <p className="text-sm font-semibold text-accent-foreground">{personalMessage}</p>
      </div>

      {/* Main item */}
      <div className="w-full max-w-sm animate-slide-up">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{result.emoji}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{result.name}</h3>
              <p className="text-xs text-muted-foreground">R${result.priceMin}–R${result.priceMax} • {result.recipe.prepTime}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isBebidaOnly ? "bg-secondary/15 text-secondary" : "bg-primary/15 text-primary"
            }`}>
              {isBebidaOnly ? "🥤 Bebida" : "🍽️ Comida"}
            </span>
          </div>
          <button onClick={() => setFoodRecipeOpen(true)}
            className="mt-3 w-full text-xs font-bold text-primary bg-primary/10 py-2 rounded-xl active:scale-95 transition-transform">
            🍳 Ver receita
          </button>
        </div>

        {/* Combo drink */}
        {isCombo && pairedDrink && (
          <>
            <div className="flex items-center justify-center py-2">
              <div className="w-px h-4 bg-border" />
              <Plus size={16} className="text-secondary mx-1" />
              <div className="w-px h-4 bg-border" />
            </div>

            <div className="bg-card border border-secondary/30 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-secondary mb-2">{drinkPhrase}</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{pairedDrink.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{pairedDrink.name}</h3>
                  <p className="text-xs text-muted-foreground">R${pairedDrink.priceMin}–R${pairedDrink.priceMax} • {pairedDrink.recipe.prepTime}</p>
                </div>
                <button onClick={() => setDrinkRecipeOpen(true)} className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-1 rounded-full">
                  🥤 Receita
                </button>
              </div>
            </div>

            <div className="mt-3 bg-accent/60 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-accent-foreground">
                💰 Combo estimado: R${result.priceMin + pairedDrink.priceMin}–R${result.priceMax + pairedDrink.priceMax}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Smart tip */}
      <div className="w-full max-w-sm bg-primary/10 rounded-xl p-3 text-center animate-slide-up">
        <p className="text-sm font-bold text-primary">{smartTip}</p>
      </div>

      {/* Partner action buttons */}
      {mainPartner && (
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-card border-2 border-secondary/30 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-secondary mb-3 text-center">
              🔥 Disponível no parceiro:
            </p>
            <p className="text-sm font-black text-foreground text-center mb-3">
              {mainPartner.name} {mainPartner.emoji}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/loja/${mainPartner.id}`)}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
              >
                🏪 Ver loja
              </button>
              <button
                onClick={() => openWhatsApp(mainPartner.whatsapp, `Olá! Vi a loja no EscolheAí 😄`)}
                className="flex-1 bg-[hsl(142,70%,45%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm shadow-md"
              >
                <MessageCircle size={16} /> Falar 📲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If combo, show drink partner too */}
      {isCombo && drinkPartner && !mainPartner && (
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-card border-2 border-secondary/30 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-secondary mb-2 text-center">🍺 Bebida disponível em:</p>
            <p className="text-sm font-black text-foreground text-center mb-3">{drinkPartner.name} {drinkPartner.emoji}</p>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/loja/${drinkPartner.id}`)}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm">
                🏪 Ver loja
              </button>
              <button onClick={() => openWhatsApp(drinkPartner.whatsapp, "Olá! Vi a loja no EscolheAí 😄")}
                className="flex-1 bg-[hsl(142,70%,45%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm shadow-md">
                <MessageCircle size={16} /> Falar 📲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* For combos: show both partners if food has a partner too */}
      {isCombo && foodPartner && drinkPartner && (
        <div className="w-full max-w-sm animate-slide-up">
          <div className="bg-accent/40 rounded-xl p-3 text-center space-y-1">
            <p className="text-[11px] font-bold text-accent-foreground">
              🍺 Bebida? <span className="text-secondary cursor-pointer" onClick={() => navigate("/loja/e-pra-ja")}>É Pra Já 🏪</span>
              {" · "}
              <span className="text-secondary cursor-pointer" onClick={() => navigate("/loja/pj-distribuidora")}>PJ Distribuidora 🏪</span>
            </p>
          </div>
        </div>
      )}

      {!isBebidaOnly && !mainPartner && (
        <div className="w-full max-w-sm animate-slide-up"><FoodActions food={result} smartTip="" /></div>
      )}

      {!isBebidaOnly && mainPartner && (
        <div className="w-full max-w-sm animate-slide-up"><FoodActions food={result} smartTip="" /></div>
      )}

      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={onOutraOpcao} className="flex-1 bg-accent text-accent-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Shuffle size={18} />Gerar outra 🔄
        </button>
        <button onClick={onReset} className="flex-1 bg-muted text-muted-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
          <RotateCcw size={18} />Início
        </button>
      </div>

      <RecipeModal food={result} open={foodRecipeOpen} onOpenChange={setFoodRecipeOpen} />
      {pairedDrink && <RecipeModal food={pairedDrink} open={drinkRecipeOpen} onOpenChange={setDrinkRecipeOpen} />}
    </div>
  );
}
