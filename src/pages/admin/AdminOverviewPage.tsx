import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingBag, DollarSign, Store, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, Flame, Trophy, BarChart3,
  Bike, Activity, XCircle, Percent, CalendarRange, DoorOpen
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
interface Delivery { id: string; status: string; created_at: string; order_value: number; app_fee?: number; is_demo?: boolean; courier_id?: string | null; }
interface Partner { id: string; status: string; is_active: boolean; is_open?: boolean; is_demo?: boolean; business_name?: string; logo_url?: string | null; business_type?: string | null; }
interface Courier { id: string; name: string; vehicle: string; is_active: boolean; }
interface PartnerLite { id: string; business_name: string; logo_url: string | null; business_type: string | null; }
interface ProductLite { id: string; name: string; image_url: string | null; partner_id: string | null; }

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
  const [partnerInfo, setPartnerInfo] = useState<Record<string, PartnerLite>>({});
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);

  const load = async () => {
    setLoading(true);
    const since = subDays(new Date(), 30).toISOString();
    const [pRes, dRes, ptRes, ptInfoRes, prodRes, cRes] = await Promise.all([
      supabase.from("payments").select("id,status,amount,created_at,customer_phone,partner_id").gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("deliveries").select("id,status,created_at,order_value,app_fee,is_demo,courier_id").eq("is_demo", false).gte("created_at", since).order("created_at", { ascending: false }),
      supabase.from("partner_applications").select("id,status,is_active,is_open,is_demo,business_name,logo_url,business_type"),
      supabase.from("partner_applications").select("id,business_name,logo_url,business_type").eq("status","approved").eq("is_active",true).eq("is_demo",false),
      supabase.from("products").select("id,name,image_url,partner_id").eq("is_active", true).eq("is_demo", false),
      supabase.from("couriers").select("id,name,vehicle,is_active"),
    ]);
    setPayments((pRes.data as Payment[]) || []);
    setDeliveries((dRes.data as Delivery[]) || []);
    setPartners((ptRes.data as Partner[]) || []);
    const map: Record<string, PartnerLite> = {};
    ((ptInfoRes.data as PartnerLite[]) || []).forEach(p => { map[p.id] = p; });
    setPartnerInfo(map);
    setProducts((prodRes.data as ProductLite[]) || []);
    setCouriers((cRes.data as Courier[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "couriers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const metrics = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const monthStart = startOfDay(subDays(new Date(), 30));
    const paid = payments.filter((p) => p.status === "approved");
    const paidToday = paid.filter((p) => isAfter(new Date(p.created_at), todayStart));
    const paidYesterday = paid.filter((p) => {
      const t = new Date(p.created_at);
      return isAfter(t, yesterdayStart) && !isAfter(t, todayStart);
    });
    const paidMonth = paid.filter((p) => isAfter(new Date(p.created_at), monthStart));
    const revenue = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueToday = paidToday.reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueYesterday = paidYesterday.reduce((s, p) => s + Number(p.amount || 0), 0);
    const revenueMonth = paidMonth.reduce((s, p) => s + Number(p.amount || 0), 0);
    const customers = new Set(paid.map((p) => p.customer_phone).filter(Boolean)).size;
    const activeStores = partners.filter((p) => p.status === "approved" && p.is_active).length;
    const openStores = partners.filter((p) => p.status === "approved" && p.is_active && p.is_open && !p.is_demo).length;
    const onlineCouriers = couriers.filter((c) => c.is_active).length;
    const platformProfit = deliveries.reduce((s, d) => s + Number(d.app_fee || 0), 0);

    const ordersToday = deliveries.filter((d) => isAfter(new Date(d.created_at), todayStart));
    const ordersYesterday = deliveries.filter((d) => {
      const t = new Date(d.created_at);
      return isAfter(t, yesterdayStart) && !isAfter(t, todayStart);
    });
    const ordersInProgress = deliveries.filter((d) => ["disponivel","aceita","em_andamento"].includes(d.status)).length;
    const ordersCancelledToday = ordersToday.filter((d) => d.status === "cancelada").length;

    return {
      totalOrders: deliveries.length,
      ordersToday: ordersToday.length,
      ordersDelta: pctDelta(ordersToday.length, ordersYesterday.length),
      ordersInProgress,
      ordersCancelledToday,
      revenue,
      revenueToday,
      revenueDelta: pctDelta(revenueToday, revenueYesterday),
      revenueMonth,
      platformProfit,
      activeStores,
      openStores,
      onlineCouriers,
      customers,
    };
  }, [payments, deliveries, partners, couriers]);

  const highlights = useMemo(() => {
    // Top loja por receita
    const revByPartner: Record<string, number> = {};
    payments.filter(p => p.status === "approved" && p.partner_id).forEach(p => {
      revByPartner[p.partner_id!] = (revByPartner[p.partner_id!] || 0) + Number(p.amount || 0);
    });
    const topPartnerId = Object.entries(revByPartner).sort((a,b) => b[1]-a[1])[0]?.[0];
    const topPartner = topPartnerId ? partnerInfo[topPartnerId] : null;
    const topPartnerRev = topPartnerId ? revByPartner[topPartnerId] : 0;

    // Crescimento semanal: receita 7d vs 7d anteriores
    const now = new Date();
    const w1 = subDays(now, 7).getTime();
    const w2 = subDays(now, 14).getTime();
    const paid = payments.filter(p => p.status === "approved");
    const last7 = paid.filter(p => new Date(p.created_at).getTime() >= w1).reduce((s,p) => s + Number(p.amount||0), 0);
    const prev7 = paid.filter(p => {
      const t = new Date(p.created_at).getTime();
      return t >= w2 && t < w1;
    }).reduce((s,p) => s + Number(p.amount||0), 0);
    const growth = pctDelta(last7, prev7);

    // Produto mais "popular" — placeholder simples por contagem (não temos itens de pedido aqui)
    const top = products[0] || null;

    return { topPartner, topPartnerRev, growth, last7, topProduct: top };
  }, [payments, partnerInfo, products]);

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

      {/* Operação em tempo real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Activity size={16} />}
          label="Em andamento"
          value={String(metrics.ordersInProgress)}
          subtitle="Pedidos abertos agora"
          tone="blue"
        />
        <KpiCard
          icon={<XCircle size={16} />}
          label="Cancelados hoje"
          value={String(metrics.ordersCancelledToday)}
          subtitle="Pedidos cancelados"
          tone="orange"
        />
        <KpiCard
          icon={<CalendarRange size={16} />}
          label="Faturamento mensal"
          value={fmt(metrics.revenueMonth)}
          subtitle="Últimos 30 dias"
          tone="green"
        />
        <KpiCard
          icon={<Percent size={16} />}
          label="Lucro plataforma"
          value={fmt(metrics.platformProfit)}
          subtitle="Taxa do app · 30d"
          tone="purple"
        />
      </div>

      {/* Live ops panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LiveOpsCard
          icon={<DoorOpen size={14} />}
          title="Lojas abertas agora"
          count={metrics.openStores}
          total={metrics.activeStores}
          color="orange"
          items={partners
            .filter((p) => p.status === "approved" && p.is_active && p.is_open && !p.is_demo)
            .slice(0, 6)
            .map((p) => ({ id: p.id, name: p.business_name || "—", sub: p.business_type || "", img: p.logo_url || null }))}
          emptyLabel="Nenhuma loja aberta no momento"
        />
        <LiveOpsCard
          icon={<Bike size={14} />}
          title="Entregadores online"
          count={metrics.onlineCouriers}
          total={couriers.length}
          color="blue"
          items={couriers
            .filter((c) => c.is_active)
            .slice(0, 6)
            .map((c) => ({ id: c.id, name: c.name, sub: (c.vehicle || "").toUpperCase(), img: null }))}
          emptyLabel="Nenhum entregador ativo"
        />
      </div>

      {/* Highlight strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <HighlightCard
          tone="orange"
          icon={<Flame size={16} />}
          tag="Loja destaque"
          title={highlights.topPartner?.business_name || "Sem dados"}
          subtitle={highlights.topPartner?.business_type || "Aguardando primeiro pedido"}
          value={highlights.topPartner ? fmt(highlights.topPartnerRev) : "—"}
          valueLabel="receita 30d"
          imgUrl={highlights.topPartner?.logo_url || null}
        />
        <HighlightCard
          tone="green"
          icon={<Trophy size={16} />}
          tag="Produto em alta"
          title={highlights.topProduct?.name || "Sem produtos"}
          subtitle="Catálogo ativo"
          value={String(products.length)}
          valueLabel="produtos ativos"
          imgUrl={highlights.topProduct?.image_url || null}
        />
        <HighlightCard
          tone="blue"
          icon={<BarChart3 size={16} />}
          tag="Crescimento semanal"
          title={fmt(highlights.last7)}
          subtitle="Últimos 7 dias vs anteriores"
          value={highlights.growth === null ? "—" : `${highlights.growth >= 0 ? "+" : ""}${highlights.growth}%`}
          valueLabel="vs semana anterior"
          imgUrl={null}
          positive={(highlights.growth ?? 0) >= 0}
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
            <div style={{ isolation: "isolate" }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={salesByDay} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
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
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.18} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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

const LIVE_TONES: Record<string, string> = {
  orange: "bg-orange-500/10 text-orange-600",
  blue: "bg-blue-500/10 text-blue-600",
};

function LiveOpsCard({
  icon, title, count, total, color, items, emptyLabel,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  total: number;
  color: keyof typeof LIVE_TONES;
  items: { id: string; name: string; sub: string; img: string | null }[];
  emptyLabel: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black text-foreground flex items-center gap-1.5">
          {icon} {title}
        </p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${LIVE_TONES[color]}`}>
            {count}/{total}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0">
                {it.img ? <img src={it.img} alt="" className="w-full h-full object-cover" /> : it.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{it.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{it.sub}</p>
              </div>
              <span className="text-[10px] font-bold text-green-600">online</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HIGHLIGHT_TONES: Record<string, string> = {
  orange: "bg-[hsl(24,95%,53%)]/10 text-[hsl(24,95%,45%)]",
  green: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600",
};

function HighlightCard({
  tone, icon, tag, title, subtitle, value, valueLabel, imgUrl, positive,
}: {
  tone: keyof typeof HIGHLIGHT_TONES;
  icon: React.ReactNode;
  tag: string; title: string; subtitle?: string;
  value: string; valueLabel?: string;
  imgUrl?: string | null;
  positive?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${HIGHLIGHT_TONES[tone]}`}>{icon}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-wider ${HIGHLIGHT_TONES[tone].split(" ")[1]}`}>{tag}</p>
        <p className="text-sm font-black text-foreground truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-base font-black ${positive === false ? "text-red-600" : "text-foreground"}`}>{value}</p>
        {valueLabel && <p className="text-[10px] text-muted-foreground">{valueLabel}</p>}
      </div>
    </div>
  );
}

function DemoStoreCard({ onReset }: { onReset: () => void }) {
  const [demoId, setDemoId] = useState<string | null>(null);
  const [pin, setPin] = useState<string>("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    supabase
      .from("partner_applications")
      .select("id, access_pin")
      .eq("is_demo", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setDemoId(data.id); setPin(data.access_pin || ""); }
      });
  }, []);

  const handleReset = async () => {
    if (!confirm("Apagar TODOS os pedidos e produtos da Loja Demo?")) return;
    setResetting(true);
    const { data, error } = await supabase.rpc("reset_demo_store");
    setResetting(false);
    if (error) { toast.error(error.message); return; }
    const r = data as { ok: boolean; deleted_orders?: number; deleted_products?: number };
    toast.success(`Demo resetada: ${r.deleted_orders || 0} pedidos, ${r.deleted_products || 0} produtos`);
    onReset();
  };

  return (
    <div className="rounded-2xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-xs font-black text-orange-600 uppercase tracking-wider">🧪 Loja Demo</p>
        <p className="text-sm font-bold text-foreground mt-0.5">Modo apresentação — dados isolados</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          PIN de acesso: <span className="font-mono font-bold text-foreground">{pin || "—"}</span>
        </p>
      </div>
      <div className="flex gap-2">
        {demoId && (
          <Link
            to={`/loja/${demoId}`}
            className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black active:scale-95"
          >
            Ver loja demo
          </Link>
        )}
        <a
          href="/portal/loja"
          className="px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-black active:scale-95"
        >
          Portal demo
        </a>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3 py-2 rounded-xl bg-red-500/10 text-red-600 text-xs font-black active:scale-95 disabled:opacity-50"
        >
          {resetting ? "..." : "Reset"}
        </button>
      </div>
    </div>
  );
}