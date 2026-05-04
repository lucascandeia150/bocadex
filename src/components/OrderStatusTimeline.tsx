import { Check, ChefHat, Bike, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Props {
  status: string;        // disponivel | aceita | em_andamento | concluida | cancelada (+ legado)
  prepStatus?: string;   // pending | preparing | ready
}

type StepKey = "received" | "preparing" | "on_the_way" | "delivered";

const STEPS: { key: StepKey; label: string; Icon: typeof Clock }[] = [
  { key: "received",  label: "Recebido",  Icon: Check },
  { key: "preparing", label: "Em preparo", Icon: ChefHat },
  { key: "on_the_way", label: "Saiu p/ entrega", Icon: Bike },
  { key: "delivered", label: "Entregue", Icon: CheckCircle2 },
];

function currentStep(status: string, prep?: string): StepKey {
  const s = (status || "").toLowerCase();
  if (["concluida", "completed", "delivered"].includes(s)) return "delivered";
  if (["em_andamento", "picked_up", "on_the_way"].includes(s)) return "on_the_way";
  if (prep === "preparing" || s === "aceita" || s === "preparing") return "preparing";
  if (prep === "ready") return "on_the_way"; // pronto, aguardando entregador retirar
  return "received";
}

export function OrderStatusTimeline({ status, prepStatus }: Props) {
  const s = (status || "").toLowerCase();
  if (s === "cancelada" || s === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 p-3">
        <XCircle className="text-destructive" size={18} />
        <p className="text-xs font-bold text-destructive">Pedido cancelado</p>
      </div>
    );
  }

  const current = currentStep(status, prepStatus);
  const currentIdx = STEPS.findIndex((st) => st.key === current);

  return (
    <div className="rounded-2xl bg-muted/30 border border-border p-3">
      <div className="flex items-start justify-between gap-1 relative">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = step.Icon;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative z-10 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse"
                    : "bg-background border-2 border-border text-muted-foreground"
                }`}
              >
                <Icon size={16} strokeWidth={2.5} />
              </div>
              <p
                className={`text-[10px] font-bold mt-1.5 text-center leading-tight ${
                  done || active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
        {/* connecting line */}
        <div className="absolute top-[18px] left-[12%] right-[12%] h-0.5 bg-border -z-0" />
        <div
          className="absolute top-[18px] left-[12%] h-0.5 bg-primary -z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 76)}%` }}
        />
      </div>
    </div>
  );
}