import { useState } from "react";
import { getPersonalizedSuggestion, getRandomFood } from "@/data/foods";
import type { Food, BudgetLevel, PreferenceMode } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { FoodActions } from "@/components/FoodActions";
import { UtensilsCrossed, Shuffle, RotateCcw, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

type Step = "home" | "q1" | "q2" | "q3" | "q4" | "result";

const assistantPhrases = [
  "Boa escolha pra hoje! 🎯",
  "Rápido, barato e resolve! 💪",
  "Hoje você pode economizar com isso 👇",
  "Perfeito pra esse momento! ✨",
];

export default function HomePage({ onChoose }: HomePageProps) {
  const [step, setStep] = useState<Step>("home");
  const [hungry, setHungry] = useState(false);
  const [budget, setBudget] = useState<BudgetLevel>("medio");
  const [speed, setSpeed] = useState<"rapido" | "tanto-faz">("tanto-faz");
  const [preference, setPreference] = useState<PreferenceMode>("tanto-faz");
  const [result, setResult] = useState<Food | null>(null);
  const [personalMessage, setPersonalMessage] = useState("");
  const [smartTip, setSmartTip] = useState("");

  const reset = () => {
    setStep("home");
    setResult(null);
    setPersonalMessage("");
    setSmartTip("");
  };

  const handleQ1 = (isHungry: boolean) => {
    setHungry(isHungry);
    setStep("q2");
  };

  const handleQ2 = (b: BudgetLevel) => {
    setBudget(b);
    setStep("q3");
  };

  const handleQ3 = (s: "rapido" | "tanto-faz") => {
    setSpeed(s);
    setStep("q4");
  };

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

  if (step === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6">
        <div className="text-center animate-bounce-in">
          <img src={logo} alt="EscolheAí" className="w-40 h-40 mx-auto mb-2 object-contain" />
          <h1 className="text-4xl font-black text-foreground">EscolheAí</h1>
          <p className="text-muted-foreground mt-2 text-lg">Seu assistente de comida! 🤖</p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3 animate-slide-up">
          <button
            onClick={() => setStep("q1")}
            className="gradient-primary text-primary-foreground font-bold text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <UtensilsCrossed size={24} />
            O que comer agora?
          </button>

          <button
            onClick={decidirPorMim}
            className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Shuffle size={22} />
            Decidir por mim
          </button>
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="flex flex-col items-center px-6 pt-8 pb-24 gap-4">
        <div className="text-center animate-bounce-in">
          <Sparkles className="mx-auto text-secondary mb-2" size={28} />
          <h2 className="text-xl font-black text-foreground">Sua escolha perfeita!</h2>
        </div>

        <div className="w-full max-w-sm bg-accent/50 rounded-2xl p-4 text-center animate-slide-up">
          <p className="text-sm font-semibold text-accent-foreground">{personalMessage}</p>
        </div>

        <div className="w-full max-w-sm">
          <FoodCard food={result} />
        </div>

        {result.savingsAmount && (
          <div className="w-full max-w-sm bg-primary/10 rounded-xl p-3 text-center animate-slide-up">
            <p className="text-sm font-bold text-primary">
              💰 Economize até R${result.savingsAmount} comparado a outras opções!
            </p>
          </div>
        )}

        <div className="w-full max-w-sm animate-slide-up">
          <FoodActions food={result} smartTip={smartTip} />
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={outraOpcao}
            className="flex-1 bg-accent text-accent-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Shuffle size={18} />
            Ver outra
          </button>
          <button
            onClick={reset}
            className="flex-1 bg-muted text-muted-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Recomeçar
          </button>
        </div>
      </div>
    );
  }

  // Questions
  if (step === "q1") {
    return (
      <QuestionScreen
        emoji="🤤"
        title="Está com muita fome?"
        subtitle="Isso me ajuda a escolher melhor pra você"
        onReset={reset}
      >
        <div className="flex gap-4 w-full max-w-xs animate-slide-up">
          <button onClick={() => handleQ1(true)} className="flex-1 gradient-primary text-primary-foreground font-bold text-xl py-5 rounded-2xl shadow-lg active:scale-95 transition-transform">
            Sim! 🍽️
          </button>
          <button onClick={() => handleQ1(false)} className="flex-1 bg-muted text-foreground font-bold text-xl py-5 rounded-2xl shadow-md active:scale-95 transition-transform">
            Não muito
          </button>
        </div>
      </QuestionScreen>
    );
  }

  if (step === "q2") {
    return (
      <QuestionScreen
        emoji="💰"
        title="Quanto quer gastar?"
        subtitle="Sem julgamento, é só pra te ajudar 😉"
        onReset={reset}
      >
        <div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up">
          <button onClick={() => handleQ2("baixo")} className="gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
            💚 Gastar pouco (até R$15)
          </button>
          <button onClick={() => handleQ2("medio")} className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
            🧡 Normal (R$15-30)
          </button>
          <button onClick={() => handleQ2("alto")} className="bg-muted text-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
            💎 Posso gastar mais
          </button>
        </div>
      </QuestionScreen>
    );
  }

  if (step === "q3") {
    return (
      <QuestionScreen
        emoji="⚡"
        title="Quer algo rápido?"
        subtitle="Quase lá! Mais uma pergunta 🎯"
        onReset={reset}
      >
        <div className="flex gap-4 w-full max-w-xs animate-slide-up">
          <button onClick={() => handleQ3("rapido")} className="flex-1 gradient-secondary text-secondary-foreground font-bold text-xl py-5 rounded-2xl shadow-lg active:scale-95 transition-transform">
            Rápido! ⚡
          </button>
          <button onClick={() => handleQ3("tanto-faz")} className="flex-1 bg-muted text-foreground font-bold text-xl py-5 rounded-2xl shadow-md active:scale-95 transition-transform">
            Tanto faz 🤷
          </button>
        </div>
      </QuestionScreen>
    );
  }

  if (step === "q4") {
    return (
      <QuestionScreen
        emoji="🍳"
        title="Prefere cozinhar ou pedir?"
        subtitle="Última pergunta! Isso muda a sugestão ✨"
        onReset={reset}
      >
        <div className="flex flex-col gap-3 w-full max-w-xs animate-slide-up">
          <button onClick={() => handleQ4("cozinhar")} className="gradient-primary text-primary-foreground font-bold text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
            👨‍🍳 Fazer em casa
          </button>
          <button onClick={() => handleQ4("pedir")} className="gradient-secondary text-secondary-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
            🛵 Pedir delivery
          </button>
          <button onClick={() => handleQ4("tanto-faz")} className="bg-muted text-foreground font-bold text-lg py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
            🤷 Tanto faz
          </button>
        </div>
      </QuestionScreen>
    );
  }

  return null;
}

function QuestionScreen({
  emoji,
  title,
  subtitle,
  onReset,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8">
      <div className="text-center animate-bounce-in">
        <span className="text-6xl block mb-4">{emoji}</span>
        <h2 className="text-2xl font-black text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>
      </div>
      {children}
      <button onClick={onReset} className="text-muted-foreground text-sm underline mt-4">Voltar ao início</button>
    </div>
  );
}
