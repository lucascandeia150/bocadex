import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, MapPin, ChefHat, MessageSquare, Utensils } from "lucide-react";

export default function SobrePage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-extrabold text-foreground">Por que o Bocadex existe? 🍔</h1>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4 text-[15px] leading-relaxed text-foreground/90">
        <p>
          O Bocadex foi criado para resolver <strong className="text-foreground">a indecisão na hora de escolher o que comer ou beber</strong>, trazendo sugestões rápidas, práticas e acessíveis direto no seu celular.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
        <p className="font-bold text-foreground text-base">Com o Bocadex, você pode:</p>
        <ul className="space-y-3 text-[15px] text-foreground/85">
          <li className="flex items-start gap-3">
            <Utensils size={18} className="text-primary mt-0.5 shrink-0" />
            <span>🍽️ Descobrir o que comer ou beber rapidamente</span>
          </li>
          <li className="flex items-start gap-3">
            <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
            <span>📍 Encontrar lojas e parceiros próximos</span>
          </li>
          <li className="flex items-start gap-3">
            <ChefHat size={18} className="text-primary mt-0.5 shrink-0" />
            <span>🍳 Ver receitas simples e práticas</span>
          </li>
          <li className="flex items-start gap-3">
            <MessageSquare size={18} className="text-primary mt-0.5 shrink-0" />
            <span>📲 Falar direto com estabelecimentos</span>
          </li>
        </ul>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3 text-[15px] leading-relaxed text-foreground/90">
        <p className="font-bold text-foreground">Tudo em um só lugar, de forma rápida e fácil.</p>
        <p className="text-muted-foreground text-sm">
          O app está em constante evolução, sempre buscando melhorar a experiência do usuário 🚀
        </p>
      </div>

      <Button
        onClick={() => navigate("/")}
        className="w-full h-12 text-base font-bold rounded-xl gap-2"
      >
        Explorar agora <Rocket size={18} />
      </Button>
    </div>
  );
}
