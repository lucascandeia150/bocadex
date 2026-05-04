import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DollarSign, Package, TrendingUp, Star } from "lucide-react";
import { buildDayBuckets, fillBuckets, withDemoFallback, fmtBRL } from "@/lib/dashboardDemo";

interface HistoryRow { id: string; fee: number; created_at: string; }

export function CourierDashboard({ history, ratingAvg, ratingCount }: { history: HistoryRow[]; ratingAvg: number; ratingCount: number }) {
  const today = useMemo(() => {
    const start = new Date(); start.setHours(0,0,0,0);
    const todays = history.filter((h) => new Date(h.created_at).getTime() >= start.getTime());
    const earnings = todays.reduce((s, h) => s + Number(h.fee || 0), 0);
    return { count: todays.length, earnings };
  }, [history]);

  const week = useMemo(() => {
    const totalWeek = history
      .filter((h) => new Date(h.created_at).getTime() >= Date.now() - 7 * 86400000)
      .reduce((s, h) => s + Number(h.fee || 0), 0);
    return totalWeek;
  }, [history]);

  const chart = useMemo(() => {
    const buckets = buildDayBuckets(7);
    const filled = fillBuckets(buckets, history, (h) => new Date(h.created_at), (h) => Number(h.fee || 0));
    return withDemoFallback(filled, 45);
  }, [history]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase">
            <DollarSign size={12} /> Ganhos hoje
          </div>
          <p className="text-xl font-black text-foreground mt-1">{fmtBRL(today.earnings)}</p>
          <p className="text-[10px] text-muted-foreground">{today.count} entrega(s)</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
            <TrendingUp size={12} /> Semana
          </div>
          <p className="text-xl font-black text-foreground mt-1">{fmtBRL(week)}</p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Star size={10} className="fill-yellow-500 text-yellow-500" /> {ratingAvg.toFixed(1)} ({ratingCount})
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-black text-foreground flex items-center gap-1">
            <Package size={12} /> Ganhos por dia
          </p>
          {chart.isDemo && (
            <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">demo</span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chart.points} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={42} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => fmtBRL(v)} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}