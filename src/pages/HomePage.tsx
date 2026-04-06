import { useState } from "react";
import { getSuggestion, getRandomFood } from "@/data/foods";
import type { Food } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { UtensilsCrossed, Shuffle, RotateCcw, Zap } from "lucide-react";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

type Step = "home" | "q1" | "q2" | "q3" | "result";

export default function HomePage({ onChoose }: HomePageProps) {
  const [step, setStep] = useState<Step>("home");
  const [hungry, setHungry] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [fast, setFast] = useState(false);
  const [result, setResult] = useState<Food | null>(null);

  const reset = () => {
    setStep("home");
    setResult(null);
  };

  const handleAnswer = (question: Step, answer: boolean) => {
    if (question === "q1") {
      setHungry(answer);
      setStep("q2");
    } else if (question === "q2") {
      setCheap(answer);
      setStep("q3");
    } else if (question === "q3") {
      setFast(answer);
      const food = getSuggestion(hungry, cheap, answer);
      setResult(food);
      onChoose(food);
      setStep("result");
    }
  };

  const decidirPorMim = () => {
    const food = getRandomFood();
    setResult(food);
    onChoose(food);
    setStep("result");
  };

  const outraOpcao = () => {
    const food = getRandomFood(result?.id);
    setResult(food);
    onChoose(food);
  };

  if (step === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6">
        <div className="text-center animate-bounce-in">
          <span className="text-6xl mb-4 block">🍽️</span>
          <h1 className="text-4xl font-black text-foreground">EscolheAí</h1>
          <p className="text-muted-foreground mt-2 text-lg">Sem indecisão, só decisão!</p>
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
      <div className="flex flex-col items-center px-6 pt-10 gap-6">
        <div className="text-center animate-bounce-in">
          <Zap className="mx-auto text-secondary mb-2" size={32} />
          <h2 className="text-2xl font-black text-foreground">Sua escolha!</h2>
          <p className="text-muted-foreground text-sm mt-1">O assistente escolheu pra você 🤖</p>
        </div>

        <div className="w-full max-w-sm">
          <FoodCard food={result} />
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

  // Question steps
  const questions: Record<string, { text: string; emoji: string }> = {
    q1: { text: "Está com muita fome?", emoji: "🤤" },
    q2: { text: "Quer gastar pouco?", emoji: "💰" },
    q3: { text: "Quer algo rápido?", emoji: "⚡" },
  };

  const q = questions[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-8">
      <div className="text-center animate-bounce-in">
        <span className="text-6xl block mb-4">{q.emoji}</span>
        <h2 className="text-2xl font-black text-foreground">{q.text}</h2>
      </div>

      <div className="flex gap-4 w-full max-w-xs animate-slide-up">
        <button
          onClick={() => handleAnswer(step, true)}
          className="flex-1 gradient-primary text-primary-foreground font-bold text-xl py-5 rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Sim
        </button>
        <button
          onClick={() => handleAnswer(step, false)}
          className="flex-1 bg-muted text-foreground font-bold text-xl py-5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          Não
        </button>
      </div>

      <button onClick={reset} className="text-muted-foreground text-sm underline mt-4">
        Voltar ao início
      </button>
    </div>
  );
}
