import { getCheapFoods, getBestValueFoods, getRecommendedFoods } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { Wallet, Star, TrendingUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Food } from "@/data/foods";

const economyMessages: Record<string, string> = {
  "arroz-feijao": "Mais barato que fast food e muito mais nutritivo",
  macarrao: "Rende muito e é delicioso",
  salada: "Saudável e cabe no bolso",
  omelete: "Ingredientes simples, resultado incrível",
  sanduiche: "Monte em casa e economize ainda mais",
  marmita: "Economia em relação a fast food",
  pastel: "Rápido e barato, perfeito pro lanche",
  coxinha: "Clássico brasileiro que não pesa no bolso",
  pf: "Refeição completa por um preço justo",
};

function getWhatsAppUrl(whatsapp: string, foodName: string) {
  const message = encodeURIComponent(`Olá! Gostaria de pedir ${foodName}. Vi no EscolheAí! 🍽️`);
  return `https://wa.me/${whatsapp}?text=${message}`;
}

function handleOpenPartner(food: Food) {
  if (food.delivery.available && food.delivery.whatsapp) {
    toast.success(`Abrindo WhatsApp do ${food.delivery.platform}...`, {
      description: `Melhor opção econômica disponível perto de você`,
    });
    window.open(getWhatsAppUrl(food.delivery.whatsapp, food.name), "_blank", "noopener,noreferrer");
  } else if (food.delivery.available && food.delivery.url) {
    toast.success(`Abrindo ${food.delivery.platform}...`, {
      description: `Melhor opção econômica disponível perto de você`,
    });
    window.open(food.delivery.url, "_blank", "noopener,noreferrer");
  } else {
    toast.info("Essa opção é melhor fazer em casa! 🏠");
  }
}

export default function EconomicoPage() {
  const cheapFoods = getCheapFoods();
  const bestValue = getBestValueFoods();
  const recommended = getRecommendedFoods();

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <Wallet className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Modo Econômico</h1>
        <p className="text-muted-foreground text-sm mt-1">As melhores opções pro seu bolso 💪</p>
      </div>

      {/* Banner */}
      <div className="max-w-sm mx-auto mb-6 bg-primary/10 rounded-2xl p-4 text-center animate-slide-up">
        <p className="text-sm font-bold text-primary">
          🎯 Melhor opção econômica disponível perto de você
        </p>
      </div>

      {/* Mais vantajoso hoje */}
      <div className="max-w-sm mx-auto mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-lg font-black text-foreground">🔥 Mais vantajoso hoje</h2>
        </div>
        <div className="flex flex-col gap-3">
          {bestValue.map((food, i) => (
            <div key={food.id} className="animate-slide-up relative" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                Melhor opção
              </div>
              <FoodCard
                food={food}
                showReason={false}
                economyMessage={food.savingsAmount ? `Economize até R$${food.savingsAmount}` : undefined}
                animate={false}
                highlight
              />
              {food.delivery.available && (
                <button
                  onClick={() => handleOpenPartner(food)}
                  className="w-full mt-2 gradient-secondary text-secondary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <ExternalLink size={16} />
                  Pedir direto com o restaurante
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recomendado */}
      <div className="max-w-sm mx-auto mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Star size={20} className="text-secondary" />
          <h2 className="text-lg font-black text-foreground">⭐ Recomendado</h2>
        </div>
        <div className="flex flex-col gap-3">
          {recommended.map((food, i) => (
            <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <FoodCard
                food={food}
                showReason={true}
                animate={false}
                recommended
              />
              {food.delivery.available && (
                <button
                  onClick={() => handleOpenPartner(food)}
                  className="w-full mt-2 bg-secondary/10 text-secondary font-semibold py-2.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={14} />
                   Pedir direto
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Todas opções econômicas */}
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={20} className="text-primary" />
          <h2 className="text-lg font-black text-foreground">💚 Todas as opções baratas</h2>
        </div>
        <div className="flex flex-col gap-3">
          {cheapFoods.map((food, i) => (
            <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <FoodCard
                food={food}
                showReason={false}
                economyMessage={economyMessages[food.id] || food.reason}
                animate={false}
              />
              {food.delivery.available && (
                <button
                  onClick={() => handleOpenPartner(food)}
                  className="w-full mt-2 bg-muted text-foreground font-semibold py-2.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink size={14} />
                  Pedir direto
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
