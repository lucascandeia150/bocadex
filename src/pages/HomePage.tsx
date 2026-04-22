import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Compass, Briefcase } from "lucide-react";
import type { Food } from "@/data/foods";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

export default function HomePage({ onChoose }: HomePageProps) {
  const navigate = useNavigate();

  const tiles = [
    {
      label: "Explorar lojas",
      emoji: "🛍️",
      icon: ShoppingBag,
      to: "/lojas",
      gradient: "gradient-primary",
      fg: "text-primary-foreground",
    },
    {
      label: "Buscar",
      emoji: "🔍",
      icon: Search,
      to: "/buscar",
      gradient: "gradient-secondary",
      fg: "text-secondary-foreground",
    },
    {
      label: "Descobrir",
      emoji: "🍽️",
      icon: Compass,
      to: "/descobrir-hub",
      gradient: "gradient-warm",
      fg: "text-primary-foreground",
    },
    {
      label: "Trabalhe com a gente",
      emoji: "🤝",
      icon: Briefcase,
      to: "/trabalhe",
      gradient: "bg-card border border-border",
      fg: "text-foreground",
    },
  ];

  return (
    <div className="flex flex-col items-center px-5 pt-6 pb-10 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full bg-accent/20 blur-2xl animate-float-slow" />
      </div>

      {/* Logo */}
      <div className="w-28 h-28 rounded-3xl bg-card shadow-2xl border border-border/50 flex items-center justify-center p-2.5 mb-4 animate-logo-entrance relative z-10">
        <img src={logo} alt="EscolheAí" className="w-full h-full object-contain animate-logo-breathe" />
      </div>

      {/* Tagline */}
      <h1 className="text-2xl font-black text-foreground text-center leading-snug mb-1 animate-text-reveal relative z-10">
        EscolheAí
      </h1>
      <p className="text-muted-foreground text-xs text-center max-w-xs mb-6 animate-text-reveal-delayed relative z-10">
        Descubra onde comer, beber e pedir. Tudo num só lugar! 🍽️
      </p>

      {/* Navigation grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md relative z-10 animate-button-pop">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={() => navigate(t.to)}
              className={`${t.gradient} ${t.fg} aspect-square rounded-2xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 p-3 hover:shadow-xl`}
            >
              <span className="text-3xl leading-none">{t.emoji}</span>
              <Icon size={22} className="opacity-90" />
              <span className="text-sm font-black text-center leading-tight px-1">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-8 animate-fade-in-late relative z-10">
        © 2026 EscolheAí — Feito com ❤️
      </p>
    </div>
  );
}
