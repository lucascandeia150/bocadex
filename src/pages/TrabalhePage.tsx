import { useNavigate } from "react-router-dom";
import { Rocket, Truck } from "lucide-react";

export default function TrabalhePage() {
  const navigate = useNavigate();

  const items = [
    {
      title: "Quero ser parceiro",
      desc: "Cadastre sua loja no Bocadex",
      emoji: "🚀",
      icon: Rocket,
      to: "/seja-parceiro",
      gradient: "gradient-primary",
      fg: "text-primary-foreground",
    },
    {
      title: "Seja um entregador",
      desc: "Faça entregas e ganhe dinheiro",
      emoji: "🚚",
      icon: Truck,
      to: "/seja-entregador",
      gradient: "gradient-secondary",
      fg: "text-secondary-foreground",
    },
  ];

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-foreground">🤝 Trabalhe com a gente</h1>
        <p className="text-xs text-muted-foreground">
          Faça parte da rede Bocadex
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

      <div className="pt-4 border-t border-border">
        <button
          onClick={() => navigate("/acesso-parceiro")}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-2 underline-offset-4 hover:underline"
        >
          Já é parceiro ou entregador? Acesse aqui →
        </button>
      </div>
    </div>
  );
}