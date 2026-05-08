import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Receipt, Wallet, Download, RefreshCw } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payment { id: string; status: string; amount: number; created_at: string; partner_id: string | null; }
interface Delivery { id: string; status: string; app_fee: number; fee: number; order_value: number; created_at: string; }

export default function AdminFinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ recovered: number; failed: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 30).toISOString();
      const [p, d] = await Promise.all([
        supabase.from("payments").select("id,status,amount,created_at,partner_id").gte("created_at", since),
        supabase.from("deliveries").select("id,status,app_fee,fee,order_value,created_at").gte("created_at", since),
      ]);
      setPayments((p.data as Payment[]) || []);
      setDeliveries((d.data as Delivery[]) || []);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    const paid = payments.filter((p) => p.status === "approved");
    const grossRevenue = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    const appFees = deliveries.reduce((s, d) => s + Number(d.app_fee || 0), 0);
    const deliveryFees = deliveries.reduce((s, d) => s + Number(d.fee || 0), 0);
    const partnerPayout = grossRevenue - appFees - deliveryFees;
    return { grossRevenue, appFees, deliveryFees, paidCount: paid.length, partnerPayout };
  }, [payments, deliveries]);

  const byDay = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return { date: d, label: format(d, "dd/MM", { locale: ptBR }), receita: 0, taxas: 0 };
    });
    payments.filter((p) => p.status === "approved").forEach((p) => {
      const day = startOfDay(new Date(p.created_at)).getTime();
      const slot = days.find((x) => x.date.getTime() === day);
      if (slot) slot.receita += Number(p.amount || 0);
    });
    deliveries.forEach((d) => {
      const day = startOfDay(new Date(d.created_at)).getTime();
      const slot = days.find((x) => x.date.getTime() === day);
      if (slot) slot.taxas += Number(d.app_fee || 0);
    });
    return days.map(({ label, receita, taxas }) => ({ label, receita: Number(receita.toFixed(2)), taxas: Number(taxas.toFixed(2)) }));
  }, [payments, deliveries]);

  const isEmpty = byDay.every((d) => d.receita === 0 && d.taxas === 0);
  const chartData = useMemo(() => {
    if (!isEmpty) return byDay;
    const curve = [0.5, 0.8, 0.65, 0.9, 1.1, 0.95, 1.2, 0.85, 1.0, 1.3, 1.1, 0.9, 1.15, 1.4];
    return byDay.map((d, i) => ({ ...d, receita: Number((curve[i] * 220).toFixed(2)), taxas: Number((curve[i] * 18).toFixed(2)) }));
  }, [byDay, isEmpty]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const exportCSV = () => {
    const rows = [["data", "receita", "taxas_app"]];
    byDay.forEach((d) => rows.push([d.label, String(d.receita), String(d.taxas)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const syncPending = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mp-sync-pending", { body: {} });
      if (error) throw error;
      setSyncResult({
        recovered: data?.recovered ?? 0,
        failed: data?.failed ?? 0,
        total: data?.total ?? 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      setSyncResult({ recovered: 0, failed: 1, total: 0 });
      console.error("sync error", msg);
    } finally {
      setSyncing(false);
    }
  };

  const TONES: Record<string, string> = {
    green: "bg-green-500/10 text-green-600", blue: "bg-blue-500/10 text-blue-600",
    orange: "bg-orange-500/10 text-orange-600", purple: "bg-purple-500/10 text-purple-600",
  };
  const FinCard = ({ icon, label, value, tone }: any) => (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TONES[tone]}`}>{icon}</div>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-black text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Receita, taxas e relatórios dos últimos 30 dias.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={syncPending}
              disabled={syncing}
              className="flex items-center gap-1 text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              title="Reconsulta pagamentos pendentes no Mercado Pago e atualiza pedidos presos em análise"
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Sincronizando..." : "Sincronizar pendentes"}
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1 text-xs font-bold bg-foreground text-background px-3 py-2 rounded-lg hover:opacity-90"><Download size={12} /> Exportar CSV</button>
          </div>
          {syncResult && (
            <p className="text-[10px] font-bold text-muted-foreground">
              {syncResult.total} verificados · {syncResult.recovered} recuperados · {syncResult.failed} falhas
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FinCard icon={<DollarSign size={16} />} label="Receita bruta" value={fmt(totals.grossRevenue)} tone="green" />
        <FinCard icon={<Receipt size={16} />} label="Pedidos pagos" value={String(totals.paidCount)} tone="blue" />
        <FinCard icon={<TrendingUp size={16} />} label="Taxas do app" value={fmt(totals.appFees)} tone="orange" />
        <FinCard icon={<Wallet size={16} />} label="Taxas de entrega" value={fmt(totals.deliveryFees)} tone="purple" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-muted-foreground">Repasse às lojas</p>
          <p className="text-xl font-black text-foreground">{fmt(Math.max(0, totals.partnerPayout))}</p>
          <p className="text-[10px] text-muted-foreground">Receita − taxas do app − entregas</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-muted-foreground">Pagar entregadores</p>
          <p className="text-xl font-black text-foreground">{fmt(totals.deliveryFees)}</p>
          <p className="text-[10px] text-muted-foreground">Soma das taxas de entrega</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-muted-foreground">Lucro plataforma</p>
          <p className="text-xl font-black text-primary">{fmt(totals.appFees)}</p>
          <p className="text-[10px] text-muted-foreground">Comissão do app</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-foreground">Receita vs taxas por dia</p>
          {isEmpty && <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">demo</span>}
        </div>
        {loading ? <div className="h-[260px] rounded-xl bg-muted animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="taxas" fill="hsl(25 95% 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
