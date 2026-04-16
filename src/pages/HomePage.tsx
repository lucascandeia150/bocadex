import logo from "@/assets/logo.png";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import type { Food } from "@/data/foods";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

export default function HomePage({ onChoose }: HomePageProps) {
  const { setOpenMobile } = useSidebar();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />
        <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full bg-accent/20 blur-2xl animate-float-slow" />
      </div>

      {/* Logo */}
      <div className="w-44 h-44 rounded-3xl bg-card shadow-2xl border border-border/50 flex items-center justify-center p-3 mb-8 animate-logo-entrance relative z-10">
        <img src={logo} alt="EscolheAí" className="w-full h-full object-contain animate-logo-breathe" />
      </div>

      {/* Tagline */}
      <h1 className="text-3xl font-black text-foreground text-center leading-snug mb-2 animate-text-reveal relative z-10">
        EscolheAí
      </h1>
      <p className="text-muted-foreground text-sm text-center max-w-xs mb-10 animate-text-reveal-delayed relative z-10">
        Descubra onde comer, beber e pedir. Tudo num só lugar! 🍽️
      </p>

      {/* Menu button */}
      <button
        onClick={() => setOpenMobile(true)}
        className="gradient-primary text-primary-foreground font-black text-lg py-5 px-14 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 animate-button-pop relative z-10 hover:shadow-xl hover:shadow-primary/25"
      >
        <Menu size={24} /> Menu
      </button>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-16 animate-fade-in-late relative z-10">
        © 2026 EscolheAí — Feito com ❤️
      </p>
    </div>
  );
}
