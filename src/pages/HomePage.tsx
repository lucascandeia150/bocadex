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
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6">
      {/* Logo */}
      <div className="w-40 h-40 rounded-3xl bg-card shadow-xl border border-border/50 flex items-center justify-center p-3 mb-8 animate-bounce-in">
        <img src={logo} alt="EscolheAí" className="w-full h-full object-contain" />
      </div>

      {/* Tagline */}
      <h1 className="text-2xl font-black text-foreground text-center leading-snug mb-2">
        EscolheAí
      </h1>
      <p className="text-muted-foreground text-sm text-center max-w-xs mb-10">
        Descubra onde comer, beber e pedir. Tudo num só lugar! 🍽️
      </p>

      {/* Menu button */}
      <button
        onClick={() => setOpenMobile(true)}
        className="gradient-primary text-primary-foreground font-black text-lg py-5 px-12 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
      >
        <Menu size={24} /> Menu
      </button>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center mt-16">
        © 2026 EscolheAí — Feito com ❤️
      </p>
    </div>
  );
}
