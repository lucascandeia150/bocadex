import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { Sparkles, Store, Briefcase, ChevronRight } from "lucide-react";
import type { Food } from "@/data/foods";
import { useHomeTiles } from "@/hooks/useHomeTiles";
import { HomeConversion } from "@/components/HomeConversion";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

export default function HomePage({ onChoose }: HomePageProps) {
  const navigate = useNavigate();
  const { tiles } = useHomeTiles();

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

      {/* CTAs principais estilo iFood */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6 relative z-10 animate-button-pop">
        <button
          onClick={() => navigate("/lojas")}
          className="group bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] text-white rounded-2xl p-4 shadow-lg active:scale-95 transition-all flex flex-col items-start gap-2 text-left overflow-hidden relative"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Store size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-black leading-tight">Explorar lojas</p>
            <p className="text-[10px] opacity-90 font-semibold flex items-center gap-0.5">
              Ver todas <ChevronRight size={10} />
            </p>
          </div>
        </button>
        <button
          onClick={() => navigate("/trabalhe")}
          className="group bg-gradient-to-br from-[hsl(24,95%,53%)] to-[hsl(24,95%,45%)] text-white rounded-2xl p-4 shadow-lg active:scale-95 transition-all flex flex-col items-start gap-2 text-left overflow-hidden relative"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Briefcase size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-black leading-tight">Trabalhe com a gente</p>
            <p className="text-[10px] opacity-90 font-semibold flex items-center gap-0.5">
              Saiba mais <ChevronRight size={10} />
            </p>
          </div>
        </button>
      </div>

      {/* Seções de conversão (promoções, lojas abertas, pedidos rápidos) */}
      <HomeConversion />

      {/* Navigation grid (atalhos) */}
      {tiles.length > 0 && (
        <div className="w-full max-w-md mt-2 mb-3 relative z-10">
          <h2 className="text-sm font-black text-foreground mb-3 px-1 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Atalhos
          </h2>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md relative z-10 animate-button-pop">
        {tiles.map((t) => {
          const Icon = (LucideIcons as Record<string, unknown>)[t.icon] as React.ComponentType<{ size?: number; className?: string }> | undefined ?? Sparkles;
          return (
            <button
              key={t.id}
              onClick={() => navigate(t.route)}
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
