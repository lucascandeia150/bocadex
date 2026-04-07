import { getCheapFoods, getBestValueFoods, getRecommendedFoods } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { Wallet, Star, TrendingUp } from "lucide-react";

export default function EconomicoPage() {
  const cheapFoods = getCheapFoods();
  const bestValue = getBestValueFoods();
  const recommended = getRecommendedFoods();

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <Wallet className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Modo Econômico</h1>
        <p className="text-muted-foreground text-sm mt-1">Coma bem gastando pouco 💪</p>
      </div>

      <div className="max-w-sm mx-auto mb-4 gradient-primary rounded-2xl p-4 text-center animate-slide-up shadow-lg">
        <p className="text-sm font-bold text-primary-foreground">
          🎯 Economize até 60% fazendo em casa — veja as opções abaixo
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-6 bg-accent/60 rounded-xl p-2.5 text-center">
        <p className="text-[11px] text-muted-foreground">
          📌 Os valores são estimativas e podem variar por região e estabelecimento
        </p>
      </div>

      <Section icon={<TrendingUp size={20} className="text-primary" />} title="🔥 Mais vantajoso hoje">
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
          </div>
        ))}
      </Section>

      <Section icon={<Star size={20} className="text-secondary" />} title="⭐ Recomendado">
        {recommended.map((food, i) => (
          <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <FoodCard food={food} showReason animate={false} recommended />
          </div>
        ))}
      </Section>

      <Section icon={<Wallet size={20} className="text-primary" />} title="💚 Todas as opções baratas">
        {cheapFoods.map((food, i) => (
          <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <FoodCard
              food={food}
              showReason={false}
              economyMessage={food.savingsAmount ? `Economize até R$${food.savingsAmount}` : food.reason}
              animate={false}
            />
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-sm mx-auto mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-black text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
