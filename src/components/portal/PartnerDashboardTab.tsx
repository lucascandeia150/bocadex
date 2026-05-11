import { useEffect, useMemo, useState } from "react";
import { Package, DollarSign, Clock, CheckCircle2, Truck, XCircle, TrendingUp, Receipt, Users, Star, Award } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { buildDayBuckets, fillBuckets, withDemoFallback, fmtBRL } from "@/lib/dashboardDemo";
import { supabase } from "@/integrations/supabase/client";

interface Delivery {
  id: string;
  status: string;
  fee: number;
  created_at: string;
  order_value?: number;
  order_description?: string;
  user_id?: string | null;
}

export default function PartnerDashboardTab({ deliveries, partnerId }: { deliveries: Delivery[]; partnerId?: string }) {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    if (!partnerId) return;
    (async () => {
      const { data } = await supabase
        .from("ratings")
        .select("stars")
        .eq("partner_id", partnerId);
      const arr = (data as { stars: number }[]) || [];
      if (arr.length) {
        setAvgRating(Number((arr.reduce((s, r) => s + r.stars, 0) / arr.length).toFixed(1)));
        setTotalRatings(arr.length);
      }
    })();
  }, [partnerId]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const weekAgo = todayMs - 6 * 24 * 60 * 60 * 1000;

    const todays = deliveries.filter((d) => new Date(d.created_at).getTime() >= todayMs);
    const weekly = deliveries.filter((d) => new Date(d.created_at).getTime() >= weekAgo);
    const sum = (arr: Delivery[]) => arr.reduce((acc, d) => acc + Number(d.order_value || 0), 0);

    return {
      todayCount: todays.length,
      todayRevenue: sum(todays),
      todayAvg: todays.length ? sum(todays) / todays.length : 0,
      weekRevenue: sum(weekly),
      activeNow: deliveries.filter((d) => d.status === "aceita" || d.status === "em_andamento").length,
      uniqueCustomers: new Set(deliveries.map((d) => d.user_id).filter(Boolean)).size,
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

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    deliveries.forEach((d) => {
      const name = (d.order_description || "Pedido").split("\n")[0].slice(0, 40);
      const cur = map.get(name) || { name, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(d.order_value || 0);
      map.set(name, cur);
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [deliveries]);

  const chart = useMemo(() => {
    const buckets = buildDayBuckets(7);
    const filled = fillBuckets(buckets, deliveries, (d) => new Date(d.created_at), (d) => Number(d.order_value || 0));
    return withDemoFallback(filled, 180);
  }, [deliveries]);

  return (
    <div className="space-y-3">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-2">
        <KCard icon={<DollarSign size={16} />} label="Vendas hoje" value={fmtBRL(stats.todayRevenue)} sub={`${stats.todayCount} pedidos`} tone="primary" />
        <KCard icon={<Clock size={16} />} label="Em andamento" value={String(stats.activeNow)} sub="Pedidos ativos" tone="orange" />
        <KCard icon={<CheckCircle2 size={16} />} label="Concluídos hoje" value={String(stats.byStatus.concluida)} sub="Finalizados" tone="emerald" />
        <KCard icon={<Receipt size={16} />} label="Ticket médio" value={fmtBRL(stats.todayAvg)} sub="Hoje" tone="amber" />
      </div>

      {/* Gráfico semanal */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-black text-foreground flex items-center gap-1">
              <TrendingUp size={12} className="text-primary" /> Faturamento (7 dias)
            </p>
            <p className="text-lg font-black text-foreground mt-0.5">{fmtBRL(stats.weekRevenue)}</p>
          </div>
          {chart.isDemo && (
            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">demo</span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chart.points} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="partnerFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={50} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => fmtBRL(v)} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#partnerFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status do dia */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <p className="text-xs font-bold text-foreground flex items-center gap-1">
          <Package size={12} /> Status dos pedidos de hoje
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatusRow icon={<Clock size={12} />} label="Aguardando" count={stats.byStatus.disponivel} color="blue" />
          <StatusRow icon={<CheckCircle2 size={12} />} label="Em preparo" count={stats.byStatus.aceita} color="amber" />
          <StatusRow icon={<Truck size={12} />} label="Em entrega" count={stats.byStatus.em_andamento} color="orange" />
          <StatusRow icon={<CheckCircle2 size={12} />} label="Concluídos" count={stats.byStatus.concluida} color="emerald" />
          {stats.byStatus.cancelada > 0 && (
            <StatusRow icon={<XCircle size={12} />} label="Cancelados" count={stats.byStatus.cancelada} color="red" />
          )}
        </div>
      </div>

      {/* Mais vendidos */}
      {topProducts.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-black text-foreground flex items-center gap-1 mb-3">
            <Award size={12} className="text-primary" /> Mais pedidos
          </p>
          <ul className="space-y-2">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  i === 0 ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"
                }`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                  <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.count / topProducts[0].count) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-foreground">{p.count}x</p>
                  <p className="text-[10px] text-muted-foreground">{fmtBRL(p.revenue)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resumo geral */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-2xl border border-border p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><Users size={11} /> Clientes únicos</div>
          <p className="text-lg font-black text-foreground mt-0.5">{stats.uniqueCustomers}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground"><Star size={11} /> Avaliação</div>
          <p className="text-lg font-black text-foreground mt-0.5">
            {avgRating != null ? `${avgRating} ⭐` : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">{totalRatings} avaliações</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Atualiza em tempo real conforme novos pedidos chegam.
      </p>
    </div>
  );
}

function KCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "primary" | "orange" | "emerald" | "amber" }) {
  const m = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    orange: "border-orange-500/30 bg-orange-500/5 text-orange-600",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-600",
  } as const;
  return (
    <div className={`rounded-2xl border p-3 ${m[tone]}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">{icon} {label}</div>
      <p className="text-lg font-black text-foreground mt-1 truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StatusRow({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: "blue" | "amber" | "orange" | "emerald" | "red" }) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    orange: "bg-orange-500/10 text-orange-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    red: "bg-red-500/10 text-red-600",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl px-2.5 py-2 ${colorMap[color]}`}>
      <span className="flex items-center gap-1 text-[11px] font-bold">{icon} {label}</span>
      <span className="text-base font-black text-foreground">{count}</span>
    </div>
  );
}
