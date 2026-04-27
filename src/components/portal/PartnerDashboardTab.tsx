import { useMemo } from "react";
import { Package, DollarSign, Clock, CheckCircle2, Truck, XCircle, TrendingUp } from "lucide-react";

interface Delivery {
  id: string;
  status: string;
  fee: number;
  created_at: string;
  order_value?: number;
}

export default function PartnerDashboardTab({ deliveries }: { deliveries: Delivery[] }) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const todays = deliveries.filter((d) => new Date(d.created_at).getTime() >= todayMs);

    const sum = (arr: Delivery[]) => arr.reduce((acc, d) => acc + Number(d.order_value || 0), 0);

    return {
      todayCount: todays.length,
      todayRevenue: sum(todays),
      totalCount: deliveries.length,
      totalRevenue: sum(deliveries),
      byStatus: {
        disponivel: todays.filter((d) => d.status === "disponivel").length,
        aceita: todays.filter((d) => d.status === "aceita").length,
        em_andamento: todays.filter((d) => d.status === "em_andamento").length,
        concluida: todays.filter((d) => d.status === "concluida").length,
        cancelada: todays.filter((d) => d.status === "cancelada").length,
      },
    };
  }, [deliveries]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-3">
      {/* Hero — hoje */}
      <div className="grid grid-cols-2 gap-2">
        <BigCard
          icon={<Package size={18} />}
          label="Pedidos hoje"
          value={String(stats.todayCount)}
          tone="primary"
        />
        <BigCard
          icon={<DollarSign size={18} />}
          label="Faturamento hoje"
          value={fmt(stats.todayRevenue)}
          tone="green"
        />
      </div>

      {/* Status do dia */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1">
          <TrendingUp size={12} /> Status dos pedidos de hoje
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatusRow icon={<Clock size={12} />} label="Aguardando" count={stats.byStatus.disponivel} color="blue" />
          <StatusRow icon={<CheckCircle2 size={12} />} label="Aceito" count={stats.byStatus.aceita} color="yellow" />
          <StatusRow icon={<Truck size={12} />} label="Saiu p/ entrega" count={stats.byStatus.em_andamento} color="orange" />
          <StatusRow icon={<CheckCircle2 size={12} />} label="Finalizado" count={stats.byStatus.concluida} color="green" />
          {stats.byStatus.cancelada > 0 && (
            <StatusRow icon={<XCircle size={12} />} label="Cancelado" count={stats.byStatus.cancelada} color="red" />
          )}
        </div>
      </div>

      {/* Histórico geral */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-bold text-foreground mb-2">Histórico geral</p>
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Total de pedidos</p>
            <p className="text-base font-black text-foreground">{stats.totalCount}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Faturamento total</p>
            <p className="text-base font-black text-primary">{fmt(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Atualiza em tempo real conforme novos pedidos chegam.
      </p>
    </div>
  );
}

function BigCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "primary" | "green" }) {
  const toneMap = {
    primary: "bg-primary/10 border-primary/30 text-primary",
    green: "bg-green-500/10 border-green-500/30 text-green-600",
  };
  return (
    <div className={`border rounded-2xl p-3 ${toneMap[tone]}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
        {icon} {label}
      </div>
      <p className="text-xl font-black text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}

function StatusRow({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: "blue" | "yellow" | "orange" | "green" | "red" }) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600",
    yellow: "bg-yellow-500/10 text-yellow-600",
    orange: "bg-orange-500/10 text-orange-600",
    green: "bg-green-500/10 text-green-600",
    red: "bg-red-500/10 text-red-600",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl px-2 py-1.5 ${colorMap[color]}`}>
      <span className="flex items-center gap-1 text-[11px] font-bold">{icon} {label}</span>
      <span className="text-sm font-black text-foreground">{count}</span>
    </div>
  );
}