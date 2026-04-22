import { useNavigate } from "react-router-dom";
import { Store, Truck, ArrowLeft } from "lucide-react";

export default function AcessoParceiroPage() {
  const navigate = useNavigate();
  return (
    <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="text-center space-y-1">
        <h1 className="text-xl font-black text-foreground">🔑 Acesso parceiro</h1>
        <p className="text-xs text-muted-foreground">
          Selecione o tipo de acesso para entrar com seu PIN
        </p>
      </div>

      <button
        onClick={() => navigate("/portal/loja")}
        className="w-full bg-card hover:bg-accent border border-border rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Store size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-foreground">🏪 Sou parceiro (Loja)</p>
          <p className="text-[11px] text-muted-foreground">
            Gerenciar pedidos e entregas
          </p>
        </div>
      </button>

      <button
        onClick={() => navigate("/portal/entregador")}
        className="w-full bg-card hover:bg-accent border border-border rounded-2xl p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Truck size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-foreground">🚚 Sou entregador</p>
          <p className="text-[11px] text-muted-foreground">
            Ver pedidos disponíveis e aceitar
          </p>
        </div>
      </button>

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        💡 Acesso restrito por PIN fornecido pelo administrador
      </p>
    </div>
  );
}