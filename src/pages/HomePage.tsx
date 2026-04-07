import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Star, Mail, Sparkles, Zap, ArrowRight, Shuffle, X, Clock, DollarSign, ChefHat } from "lucide-react";
import { getPersonalizedSuggestion, getRandomFood, allItems } from "@/data/foods";
import type { Food, BudgetLevel, PreferenceMode } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { FoodActions } from "@/components/FoodActions";
import { PartnerBanner } from "@/components/PartnerBanner";
import { RecipeModal } from "@/components/RecipeModal";
import { stores, categoryLabels, getAllCategories, type StoreCategory } from "@/data/stores";
import logo from "@/assets/logo.png";
import { RotateCcw } from "lucide-react";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

type Step = "home" | "q1" | "q2" | "q3" | "q4" | "result";

const assistantPhrases = [
  "Boa escolha pra hoje! 🎯",
  "Isso resolve rápido! 💪",
  "Você vai economizar com isso 👇",
  "Perfeito pra esse momento! ✨",
  "Prático e delicioso! 😋",
];

const categories = getAllCategories();

export default function HomePage({ onChoose }: HomePageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("home");
  const [hungry, setHungry] = useState(false);
  const [budget, setBudget] = useState<BudgetLevel>("medio");
  const [speed, setSpeed] = useState<"rapido" | "tanto-faz">("tanto-faz");
  const [preference, setPreference] = useState<PreferenceMode>("tanto-faz");
  const [result, setResult] = useState<Food | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");
  const [smartTip, setSmartTip] = useState("");

  // Search
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

  const reset = () => {
    setStep("home");
    setResult(null);
    setPersonalMessage("");
    setSmartTip("");
  };

  const handleQ1 = (isHungry: boolean) => { setHungry(isHungry); setStep("q2"); };
  const handleQ2 = (b: BudgetLevel) => { setBudget(b); setStep("q3"); };
  const handleQ3 = (s: "rapido" | "tanto-faz") => { setSpeed(s); setStep("q4"); };
  const handleQ4 = (pref: PreferenceMode) => {
    setPreference(pref);
    const { food, message, smartTip: tip } = getPersonalizedSuggestion(hungry, budget, speed, pref);
    setResult(food);
    setPersonalMessage(message);
    setSmartTip(tip);
    onChoose(food);
    setStep("result");
  };

  const decidirPorMim = () => {
    const food = getRandomFood();
    setResult(food);
    setPersonalMessage(assistantPhrases[Math.floor(Math.random() * assistantPhrases.length)]);
    setSmartTip("💡 Essa opção equilibra custo e tempo!");
    onChoose(food);
    setStep("result");
  };

  const outraOpcao = () => {
    const food = getRandomFood(result?.id);
    setResult(food);
    setPersonalMessage(assistantPhrases[Math.floor(Math.random() * assistantPhrases.length)]);
    setSmartTip("💡 Essa opção equilibra custo e tempo!");
    onChoose(food);
  };

  // Question flow screens
  if (step === "q1") return <QuestionScreen step={1} emoji="🤤" title="Está com muita fome?" subtitle="Isso ajuda a escolher o tamanho ideal" onReset={reset}><div className="flex gap-4 w-full max-w-xs animate-slide-up"><button onClick={() => handleQ1(true)} className="flex-1 gradient-primary text-primary-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform">Sim! 🍽️</button><button onClick={() => handleQ1(false)} className="flex-1 bg-muted text-foreground font-bold text-lg py-5 rounded-2xl shadow-md active:scale-95 transition-transform">Não muito 😊</button></div></QuestionScreen>;
  if (step === "q2") return <QuestionScreen step={2} emoji="💰" title="Quanto quer gastar?" subtitle="Sem julgamento, é só pra te ajudar 😉" onReset={reset}><div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up"><button onClick={() => handleQ2("baixo")} className="gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">💚 Gastar pouco (até R$15)</button><button onClick={() => handleQ2("medio")} className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">🧡 Normal (R$15–30)</button><button onClick={() => handleQ2("alto")} className="bg-muted text-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">💎 Posso gastar mais</button></div></QuestionScreen>;
  if (step === "q3") return <QuestionScreen step={3} emoji="⚡" title="Quer algo rápido?" subtitle="Quase lá! Mais uma pergunta 🎯" onReset={reset}><div className="flex gap-4 w-full max-w-xs animate-slide-up"><button onClick={() => handleQ3("rapido")} className="flex-1 gradient-secondary text-secondary-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform">Rápido! ⚡</button><button onClick={() => handleQ3("tanto-faz")} className="flex-1 bg-muted text-foreground font-bold text-lg py-5 rounded-2xl shadow-md active:scale-95 transition-transform">Tanto faz 🤷</button></div></QuestionScreen>;
  if (step === "q4") return <QuestionScreen step={4} emoji="🍳" title="Cozinhar ou pedir?" subtitle="Última! Isso muda tudo ✨" onReset={reset}><div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up"><button onClick={() => handleQ4("cozinhar")} className="gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">👨‍🍳 Fazer em casa</button><button onClick={() => handleQ4("pedir")} className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">🛵 Pedir delivery</button><button onClick={() => handleQ4("tanto-faz")} className="bg-muted text-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">🤷 Tanto faz</button></div></QuestionScreen>;

  if (step === "result" && result) {
    return <ResultScreen result={result} personalMessage={personalMessage} smartTip={smartTip} onOutraOpcao={outraOpcao} onReset={reset} />;
  }

  // Main home hub
  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="text-center mb-5 animate-bounce-in">
        <img src={logo} alt="EscolheAí" className="w-20 h-20 mx-auto mb-2 object-contain drop-shadow-lg" />
        <h1 className="text-2xl font-black text-foreground">Sem ideia do que comer? 🤔</h1>
        <p className="text-muted-foreground text-sm mt-1">A gente resolve pra você 🤖</p>
      </div>

      {/* Search bar */}
      <div className="max-w-sm mx-auto mb-5 animate-slide-up relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Buscar comida ou receita... 🔍"
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onMouseDown={() => { setSelectedFood(item); setRecipeOpen(true); setSearchQuery(""); }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0"
              >
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
            <button
              onMouseDown={() => { navigate("/buscar"); }}
              className="w-full text-center px-4 py-2.5 text-xs font-bold text-primary hover:bg-accent/50 transition-colors"
            >
              Ver todos os resultados →
            </button>
          </div>
        )}

        {searchFocused && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-2xl shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Nada encontrado 😕</p>
            <button
              onMouseDown={() => navigate("/buscar")}
              className="mt-2 text-xs font-bold text-primary"
            >
              Buscar com IA na aba Buscar →
            </button>
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="max-w-sm mx-auto flex flex-col gap-3 mb-6 animate-slide-up">
        <button
          onClick={() => setStep("q1")}
          className="gradient-primary text-primary-foreground font-black text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Zap size={22} />
          Decidir agora
          <ArrowRight size={18} />
        </button>
        <button
          onClick={decidirPorMim}
          className="gradient-secondary text-secondary-foreground font-bold text-base py-4 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Shuffle size={20} />
          Surpresa! Escolhe pra mim
        </button>
      </div>

      {/* Destaques do dia */}
      <div className="max-w-sm mx-auto mb-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={20} className="text-secondary" />
          Destaques do dia 🔥
        </h2>
        <PartnerBanner />
      </div>

      {/* Categorias */}
      <div className="max-w-sm mx-auto mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <h2 className="text-lg font-black text-foreground mb-3">Categorias</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate("/lojas")}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-transform hover:border-primary/30"
            >
              <span className="text-3xl">{categoryLabels[cat].emoji}</span>
              <span className="text-xs font-bold text-foreground">{categoryLabels[cat].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nav buttons */}
      <div className="max-w-sm mx-auto flex flex-col gap-2.5 animate-slide-up" style={{ animationDelay: "150ms" }}>
        <NavButton icon={<ShoppingBag size={20} />} label="Explorar lojas 🛍️" onClick={() => navigate("/lojas")} />
        <NavButton icon={<Search size={20} />} label="Buscar receitas 🍽️" onClick={() => navigate("/buscar")} />
        <NavButton icon={<Star size={20} />} label="Avaliar app ⭐" onClick={() => navigate("/avaliar")} />
        <NavButton icon={<Mail size={20} />} label="Contato 📩" onClick={() => navigate("/contato")} />
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-8">
        © 2026 EscolheAí — Feito com ❤️
      </p>

      {selectedFood && <RecipeModal food={selectedFood} open={recipeOpen} onOpenChange={setRecipeOpen} />}
    </div>
  );
}

/* ── Nav Button ── */
function NavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform hover:border-primary/30 text-left"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-bold text-foreground flex-1">{label}</span>
      <ArrowRight size={16} className="text-muted-foreground" />
    </button>
  );
}

/* ── Sub-components ── */
function QuestionScreen({ step, emoji, title, subtitle, onReset, children }: { step: number; emoji: string; title: string; subtitle: string; onReset: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? "w-10 bg-primary" : "w-6 bg-muted"}`} />
        ))}
      </div>
      <div className="text-center animate-bounce-in">
        <span className="text-5xl block mb-3">{emoji}</span>
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>
      </div>
      {children}
      <button onClick={onReset} className="text-muted-foreground text-sm underline mt-2">Voltar ao início</button>
    </div>
  );
}

function ResultScreen({ result, personalMessage, smartTip, onOutraOpcao, onReset }: { result: Food; personalMessage: string; smartTip: string; onOutraOpcao: () => void; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-6 pb-10 gap-4">
      <div className="text-center animate-bounce-in">
        <Sparkles className="mx-auto text-secondary mb-1" size={26} />
        <h2 className="text-xl font-black text-foreground">Sua escolha perfeita!</h2>
      </div>
      <div className="w-full max-w-sm bg-accent/50 rounded-2xl p-4 text-center animate-slide-up">
        <p className="text-sm font-semibold text-accent-foreground">{personalMessage}</p>
      </div>
      <div className="w-full max-w-sm"><FoodCard food={result} /></div>
      {result.savingsAmount && (
        <div className="w-full max-w-sm bg-primary/10 rounded-xl p-3 text-center animate-slide-up">
          <p className="text-sm font-bold text-primary">💰 Economize até R${result.savingsAmount} comparado a outras opções!</p>
        </div>
      )}
      <div className="w-full max-w-sm animate-slide-up"><FoodActions food={result} smartTip={smartTip} /></div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={onOutraOpcao} className="flex-1 bg-accent text-accent-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Shuffle size={18} />Ver outra
        </button>
        <button onClick={onReset} className="flex-1 bg-muted text-muted-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
          <RotateCcw size={18} />Recomeçar
        </button>
      </div>
    </div>
  );
}
