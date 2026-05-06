import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Store, Briefcase, ChevronRight, Search } from "lucide-react";
import type { Food } from "@/data/foods";
import { HomeConversion } from "@/components/HomeConversion";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

export default function HomePage({ onChoose }: HomePageProps) {
  const navigate = useNavigate();

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
        <img src={logo} alt="Bocadex" className="w-full h-full object-contain animate-logo-breathe" />
      </div>

      {/* Tagline */}
      <h1 className="text-2xl font-black text-foreground text-center leading-snug mb-1 animate-text-reveal relative z-10">
        Bocadex
      </h1>
      <p className="text-muted-foreground text-xs text-center max-w-xs mb-6 animate-text-reveal-delayed relative z-10">
        Descubra onde comer, beber e pedir. Tudo num só lugar! 🍽️
      </p>

      {/* Barra de busca estilo iFood */}
      <button
        onClick={() => navigate("/buscar")}
        className="w-full max-w-md mb-5 bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-transform relative z-10 animate-slide-up"
        aria-label="Buscar lojas"
      >
        <Search size={18} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">Buscar lojas ou comidas</span>
      </button>

      {/* CTAs principais estilo iFood */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 relative z-10 animate-button-pop">
        <button
          onClick={() => navigate("/lojas")}
          className="group bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] text-white rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 flex flex-col items-start gap-3 text-left overflow-hidden relative"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-active:scale-90 transition-transform">
            <Store size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-black leading-tight">Explorar lojas</p>
            <p className="text-[11px] opacity-90 font-semibold flex items-center gap-0.5 mt-0.5">
              Ver todas <ChevronRight size={10} />
            </p>
          </div>
        </button>
        <button
          onClick={() => navigate("/trabalhe")}
          className="group bg-gradient-to-br from-[hsl(24,95%,53%)] to-[hsl(24,95%,45%)] text-white rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 flex flex-col items-start gap-3 text-left overflow-hidden relative"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-active:scale-90 transition-transform">
            <Briefcase size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-black leading-tight">Trabalhe com a gente</p>
            <p className="text-[11px] opacity-90 font-semibold flex items-center gap-0.5 mt-0.5">
              Saiba mais <ChevronRight size={10} />
            </p>
          </div>
        </button>
      </div>

      {/* Seções de conversão (promoções, lojas abertas, pedidos rápidos) */}
      <HomeConversion />

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-8 animate-fade-in-late relative z-10">
        © 2026 Bocadex — Feito com ❤️
      </p>
    </div>
  );
}
