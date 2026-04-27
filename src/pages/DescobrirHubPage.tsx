import { useNavigate } from "react-router-dom";
import { Dice5, ChefHat } from "lucide-react";

export default function DescobrirHubPage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Sugestão do dia",
      desc: "Deixe o app escolher por você",
      emoji: "🎲",
      icon: Dice5,
      to: "/descobrir",
      gradient: "gradient-secondary",
      fg: "text-secondary-foreground",
    },
    {
      title: "Receitas",
      desc: "Aprenda a preparar pratos saborosos",
      emoji: "🍳",
      icon: ChefHat,
      to: "/receitas",
      gradient: "gradient-primary",
      fg: "text-primary-foreground",
    },
  ];

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-foreground">🍽️ Descobrir</h1>
        <p className="text-xs text-muted-foreground">
          Escolha como quer se inspirar hoje
        </p>
      </div>

      <div className="grid gap-3 pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.title}
              onClick={() => navigate(it.to)}
              className={`${it.gradient} ${it.fg} rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all shadow-lg`}
            >
              <span className="text-4xl">{it.emoji}</span>
              <div className="flex-1">
                <p className="text-base font-black">{it.title}</p>
                <p className="text-[11px] opacity-90">{it.desc}</p>
              </div>
              <Icon size={22} className="opacity-90" />
            </button>
          );
        })}
      </div>
    </div>
  );
}