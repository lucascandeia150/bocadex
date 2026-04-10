import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Lightbulb, Handshake, ArrowRight } from "lucide-react";

export default function SobrePage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-6 pb-24 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-extrabold text-foreground">Sobre o EscolheAí 🍔</h1>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4 text-[15px] leading-relaxed text-foreground/90">
        <p className="text-lg font-bold text-foreground">
          Sem ideia do que comer ou beber? 🤔
        </p>
        <p className="text-primary font-extrabold text-lg">
          O EscolheAí resolve isso pra você!
        </p>
        <p>
          Nosso app foi criado para facilitar sua vida na hora da decisão. Com apenas alguns cliques, você descobre sugestões de comidas, bebidas e opções próximas, sem precisar perder tempo procurando.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-base">
          <Lightbulb size={20} />
          <span>Para você, cliente:</span>
        </div>
        <ul className="space-y-2 text-[15px] text-foreground/85 pl-1">
          <li>✅ Sugestões rápidas do que comer ou beber</li>
          <li>✅ Ideias práticas e acessíveis</li>
          <li>✅ Receitas simples quando quiser fazer em casa</li>
          <li>✅ Conexão direta com lojas parceiras</li>
        </ul>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-secondary font-bold text-base">
          <Handshake size={20} />
          <span>Para parceiros:</span>
        </div>
        <ul className="space-y-2 text-[15px] text-foreground/85 pl-1">
          <li>📢 Divulgação dentro do app</li>
          <li>👀 Mais visibilidade para seus produtos</li>
          <li>💬 Conexão direta com clientes via WhatsApp</li>
        </ul>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-3 text-[15px] leading-relaxed text-foreground/90">
        <p className="font-bold text-foreground">Nosso objetivo é simples:</p>
        <p>👉 Te ajudar a decidir rápido</p>
        <p>👉 Conectar você ao que precisa</p>
        <p>👉 Economizar seu tempo</p>
        <p className="pt-2 text-muted-foreground text-sm">
          O app ainda está em evolução e novas funcionalidades estão sendo adicionadas constantemente 🚀
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
