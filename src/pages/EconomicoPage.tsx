import { getCheapFoods, getBestValueFoods, getRecommendedFoods } from "@/data/foods";
import { FoodCard } from "@/components/FoodCard";
import { Wallet, Star, TrendingUp, MessageCircle, ExternalLink, Flame } from "lucide-react";
import { toast } from "sonner";
import type { Food } from "@/data/foods";

function getWhatsAppUrl(whatsapp: string, foodName: string) {
  const message = encodeURIComponent(`Olá! Gostaria de pedir ${foodName}. Vi no EscolheAí! 🍽️`);
  return `https://wa.me/${whatsapp}?text=${message}`;
}

function handleOpenPartner(food: Food) {
  if (food.delivery.available && food.delivery.whatsapp) {
    toast.success(`Abrindo WhatsApp do ${food.delivery.platform}...`, {
      description: `Melhor opção econômica perto de você`,
    });
    window.open(getWhatsAppUrl(food.delivery.whatsapp, food.name), "_blank", "noopener,noreferrer");
  } else if (food.delivery.available && food.delivery.url) {
    toast.success(`Abrindo ${food.delivery.platform}...`);
    window.open(food.delivery.url, "_blank", "noopener,noreferrer");
  } else {
    toast.info("Essa opção é ideal pra fazer em casa! 🏠");
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
        <p className="text-muted-foreground text-sm mt-1">Coma bem gastando pouco 💪</p>
      </div>

      {/* Banner */}
      <div className="max-w-sm mx-auto mb-6 gradient-primary rounded-2xl p-4 text-center animate-slide-up shadow-lg">
        <p className="text-sm font-bold text-primary-foreground">
          🎯 Economize até 60% fazendo em casa — veja as opções abaixo
        </p>
      </div>

      {/* Mais vantajoso */}
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
            <PartnerButton food={food} variant="primary" />
          </div>
        ))}
      </Section>

      {/* Recomendado */}
      <Section icon={<Star size={20} className="text-secondary" />} title="⭐ Recomendado">
        {recommended.map((food, i) => (
          <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <FoodCard food={food} showReason animate={false} recommended />
            <PartnerButton food={food} variant="secondary" />
          </div>
        ))}
      </Section>

      {/* Todas baratas */}
      <Section icon={<Wallet size={20} className="text-primary" />} title="💚 Todas as opções baratas">
        {cheapFoods.map((food, i) => (
          <div key={food.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <FoodCard
              food={food}
              showReason={false}
              economyMessage={food.savingsAmount ? `Economize até R$${food.savingsAmount}` : food.reason}
              animate={false}
            />
            <PartnerButton food={food} variant="muted" />
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

function PartnerButton({ food, variant }: { food: Food; variant: "primary" | "secondary" | "muted" }) {
  if (!food.delivery.available) return null;

  const styles = {
    primary: "gradient-secondary text-secondary-foreground font-bold shadow-md",
    secondary: "bg-secondary/10 text-secondary font-semibold",
    muted: "bg-muted text-foreground font-semibold",
  };

  return (
    <button
      onClick={() => handleOpenPartner(food)}
      className={`w-full mt-2 py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm ${styles[variant]}`}
    >
      {food.delivery.whatsapp ? <MessageCircle size={16} /> : <ExternalLink size={16} />}
      {variant === "primary" ? (
        <>Pedir agora <Flame size={14} /></>
      ) : (
        "Pedir direto"
      )}
    </button>
  );
}
