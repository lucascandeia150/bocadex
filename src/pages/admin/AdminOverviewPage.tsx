import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, DollarSign, Store, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Payment {
  id: string; status: string; amount: number; created_at: string;
  customer_phone: string | null; partner_id: string | null;
}
interface Delivery { id: string; status: string; created_at: string; order_value: number; is_demo?: boolean; }
interface Partner { id: string; status: string; is_active: boolean; is_demo?: boolean; }

const STATUS_COLORS: Record<string, string> = {
  disponivel: "hsl(217 91% 60%)",
  aceita: "hsl(45 93% 47%)",
  em_andamento: "hsl(25 95% 53%)",
  concluida: "hsl(142 76% 36%)",
  cancelada: "hsl(0 84% 60%)",
};
const STATUS_LABEL: Record<string, string> = {
  disponivel: "Pago",
  aceita: "Em preparo",
  em_andamento: "Saiu p/ entrega",
  concluida: "Concluído",
  cancelada: "Cancelado",
};

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  const load = async () => {
    setLoading(true);
    const since = subDays(new Date(), 30).toISOString();
    const [pRes, dRes, ptRes] = await Promise.all([
      supabase.from("payments").select("id,status,amount,created_at,customer_phone,partner_id").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("deliveries").select("id,status,created_at,order_value,is_demo").eq("is_demo", false).gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("partner_applications").select("id,status,is_active,is_demo"),
    ]);
    setPayments((pRes.data as Payment[]) || []);
    setDeliveries((dRes.data as Delivery[]) || []);
    setPartners((ptRes.data as Partner[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const metrics = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const paid = payments.filter((p) => p.status === "approved");
    const paidToday = paid.filter((p) => isAfter(new Date(p.created_at), todayStart));
    const paidYesterday = paid.filter((p) => {
      const t = new Date(p.created_at);
      return isAfter(t, yesterdayStart) && !isAfter(t, todayStart);
    });
    const revenue = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueToday = paidToday.reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueYesterday = paidYesterday.reduce((s, p) => s + Number(p.amount || 0), 0);
    const customers = new Set(paid.map((p) => p.customer_phone).filter(Boolean)).size;
    const activeStores = partners.filter((p) => p.status === "approved" && p.is_active).length;

    const ordersToday = deliveries.filter((d) => isAfter(new Date(d.created_at), todayStart));
    const ordersYesterday = deliveries.filter((d) => {
      const t = new Date(d.created_at);
      return isAfter(t, yesterdayStart) && !isAfter(t, todayStart);
    });

    return {
      totalOrders: deliveries.length,
      ordersToday: ordersToday.length,
      ordersDelta: pctDelta(ordersToday.length, ordersYesterday.length),
      revenue,
      revenueToday,
      revenueDelta: pctDelta(revenueToday, revenueYesterday),
      activeStores,
      customers,
    };
  }, [payments, deliveries, partners]);

  const salesByDay = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: d, label: format(d, "dd/MM", { locale: ptBR }), revenue: 0, orders: 0 };
    });
    const paid = payments.filter((p) => p.status === "approved");
    paid.forEach((p) => {
      const day = startOfDay(new Date(p.created_at)).getTime();
      const slot = days.find((x) => x.date.getTime() === day);
      if (slot) slot.revenue += Number(p.amount || 0);
    });
    deliveries.forEach((d) => {
      const day = startOfDay(new Date(d.created_at)).getTime();
      const slot = days.find((x) => x.date.getTime() === day);
      if (slot) slot.orders += 1;
    });
    return days.map(({ label, revenue, orders }) => ({ label, revenue: Number(revenue.toFixed(2)), orders }));
  }, [payments, deliveries]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    deliveries.forEach((d) => { map[d.status] = (map[d.status] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => ({
      key, name: STATUS_LABEL[key] || key, value, color: STATUS_COLORS[key] || "hsl(220 9% 60%)",
    }));
  }, [deliveries]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos últimos 30 dias · atualiza em tempo real
        </p>
      </div>

      <DemoStoreCard onReset={load} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<ShoppingBag size={16} />}
          label="Pedidos hoje"
          value={String(metrics.ordersToday)}
          delta={metrics.ordersDelta}
          subtitle={`${metrics.totalOrders} no período`}
          tone="blue"
        />
        <KpiCard
          icon={<DollarSign size={16} />}
          label="Receita hoje"
          value={fmt(metrics.revenueToday)}
          delta={metrics.revenueDelta}
          subtitle={`Total ${fmt(metrics.revenue)}`}
          tone="green"
        />
        <KpiCard
          icon={<Store size={16} />}
          label="Lojas ativas"
          value={String(metrics.activeStores)}
          subtitle="Aprovadas e ativas"
          tone="orange"
        />
        <KpiCard
          icon={<Users size={16} />}
          label="Clientes"
          value={String(metrics.customers)}
          subtitle="Telefones únicos / 30d"
          tone="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ChartCard
          title="Vendas por dia"
          subtitle="Últimos 14 dias"
          icon={<TrendingUp size={14} />}
          className="lg:col-span-2"
        >
          {loading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesByDay} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12, fontSize: 12,
                  }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Pedidos por status"
          subtitle="Distribuição atual"
          icon={<Clock size={14} />}
        >
          {loading || ordersByStatus.length === 0 ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {ordersByStatus.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12, fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Pedidos por dia"
        subtitle="Volume diário · últimos 14 dias"
        icon={<ShoppingBag size={14} />}
      >
        {loading ? <ChartSkeleton /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesByDay} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12, fontSize: 12,
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function pctDelta(today: number, yesterday: number): number | null {
  if (yesterday === 0) return today > 0 ? 100 : null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

const TONES: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-green-500/10 text-green-600",
  orange: "bg-orange-500/10 text-orange-600",
  purple: "bg-purple-500/10 text-purple-600",
};

function KpiCard({
  icon, label, value, subtitle, delta, tone,
}: {
  icon: React.ReactNode; label: string; value: string; subtitle?: string;
  delta?: number | null; tone: keyof typeof TONES;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TONES[tone]}`}>
          {icon}
        </div>
        {delta !== undefined && delta !== null && (
          <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            delta >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          }`}>
            {delta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-black text-foreground mt-0.5 truncate">{value}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({
  title, subtitle, icon, children, className,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-4 ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-black text-foreground flex items-center gap-1.5">
            {icon} {title}
          </p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[220px] rounded-xl bg-muted animate-pulse" />;
}