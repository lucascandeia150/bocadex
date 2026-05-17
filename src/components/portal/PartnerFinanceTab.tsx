import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Receipt, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { fmtBRL } from "@/lib/dashboardDemo";

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  customer_name: string;
  fulfillment_type: string;
  order_description: string;
}

interface Props {
  partnerId: string;
  appFeePercent?: number;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  approved: { label: "Pago", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { label: "Pendente", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  rejected: { label: "Recusado", color: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  refunded: { label: "Estornado", color: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
  cancelled: { label: "Cancelado", color: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
};

export default function PartnerFinanceTab({ partnerId, appFeePercent = 8 }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"7" | "30" | "all">("30");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("id, amount, status, created_at, customer_name, fulfillment_type, order_description")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(500);
    setPayments((data as Payment[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [partnerId]);

  const filtered = useMemo(() => {
    if (period === "all") return payments;
    const days = period === "7" ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return payments.filter((p) => new Date(p.created_at).getTime() >= cutoff);
  }, [payments, period]);

  const stats = useMemo(() => {
    const approved = filtered.filter((p) => p.status === "approved");
    const pending = filtered.filter((p) => p.status === "pending");
    const gross = approved.reduce((s, p) => s + Number(p.amount || 0), 0);
    const fee = gross * (appFeePercent / 100);
    return {
      gross,
      fee,
      net: gross - fee,
      approvedCount: approved.length,
      pendingCount: pending.length,
      pendingValue: pending.reduce((s, p) => s + Number(p.amount || 0), 0),
    };
  }, [filtered, appFeePercent]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-foreground flex items-center gap-2">
          <DollarSign size={16} className="text-primary" /> Financeiro
        </h2>
        <div className="flex gap-1">
          {(["7", "30", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                period === p ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              }`}
            >
              {p === "all" ? "Tudo" : `${p}d`}
            </button>
          ))}
          <button onClick={load} className="p-1.5 rounded-full bg-muted active:scale-95">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Saldo destacado */}
      <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-lg shadow-primary/20 android-stable-layer">
        <p className="text-[11px] uppercase tracking-widest opacity-90 font-bold">Saldo a receber (líquido)</p>
        <p className="text-3xl font-black mt-1">{fmtBRL(stats.net)}</p>
        <p className="text-[11px] opacity-90 mt-2">
          Vendas {fmtBRL(stats.gross)} − Taxas {fmtBRL(stats.fee)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KCard icon={<TrendingUp size={14} />} label="Vendas" value={fmtBRL(stats.gross)} sub={`${stats.approvedCount} pedidos pagos`} tone="primary" />
        <KCard icon={<Receipt size={14} />} label={`Taxa app (${appFeePercent}%)`} value={fmtBRL(stats.fee)} sub="Já descontada" tone="amber" />
        <KCard icon={<Clock size={14} />} label="Pagamentos pendentes" value={String(stats.pendingCount)} sub={fmtBRL(stats.pendingValue)} tone="slate" />
        <KCard icon={<CheckCircle2 size={14} />} label="Concluídos" value={String(stats.approvedCount)} sub={period === "all" ? "Total" : `Últimos ${period} dias`} tone="emerald" />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-black text-foreground">Histórico de pagamentos</p>
          <span className="text-[10px] text-muted-foreground">{filtered.length} registros</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <AlertTriangle size={20} className="mx-auto mb-2 opacity-50" />
            Sem pagamentos no período selecionado.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.slice(0, 50).map((p) => {
              const s = STATUS_LABEL[p.status] || { label: p.status, color: "bg-muted text-muted-foreground" };
              return (
                <li key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {p.customer_name || "Cliente"}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
                        · {p.fulfillment_type === "pickup" ? "Retirada" : "Entrega"}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">{fmtBRL(Number(p.amount || 0))}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${s.color}`}>{s.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground text-center italic">
        Os repasses são feitos conforme o ciclo financeiro acordado. Em caso de dúvidas, contate o suporte.
      </p>
    </div>
  );
}

function KCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone: "primary" | "amber" | "emerald" | "slate" }) {
  const m = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-600",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
    slate: "border-slate-500/20 bg-slate-500/5 text-slate-600",
  } as const;
  return (
    <div className={`rounded-2xl border p-3 ${m[tone]}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">{icon} {label}</div>
      <p className="text-base font-black text-foreground mt-1 truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
