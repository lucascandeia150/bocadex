import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Percent, RefreshCw, Store, Save } from "lucide-react";
import { toast } from "sonner";

interface Delivery {
  id: string;
  partner_id: string | null;
  partner_name: string;
  order_description: string;
  order_value: number;
  app_fee: number;
  status: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  disponivel: { label: "Aguardando", color: "bg-blue-500/10 text-blue-600" },
  aceita: { label: "Aceita", color: "bg-yellow-500/10 text-yellow-600" },
  em_andamento: { label: "Em andamento", color: "bg-orange-500/10 text-orange-600" },
  concluida: { label: "Finalizado", color: "bg-green-500/10 text-green-600" },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-600" },
};

export default function AdminFeesTab() {
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [feePercent, setFeePercent] = useState<number>(8);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [savingPct, setSavingPct] = useState(false);

  const load = async () => {
    setLoading(true);
    const [delRes, setRes] = await Promise.all([
      supabase
        .from("deliveries")
        .select("id, partner_id, partner_name, order_description, order_value, app_fee, status, created_at")
        .gt("app_fee", 0)
        .order("created_at", { ascending: false }),
      supabase
        .from("delivery_settings")
        .select("id, app_fee_percent")
        .limit(1)
        .maybeSingle(),
    ]);
    setDeliveries((delRes.data as Delivery[]) || []);
    if (setRes.data) {
      setSettingsId((setRes.data as { id: string }).id);
      setFeePercent(Number((setRes.data as { app_fee_percent: number }).app_fee_percent ?? 8));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePercent = async () => {
    if (!settingsId) {
      toast.error("Configurações não encontradas");
      return;
    }
    if (feePercent < 0 || feePercent > 100) {
      toast.error("Porcentagem deve estar entre 0 e 100");
      return;
    }
    setSavingPct(true);
    const { error } = await supabase
      .from("delivery_settings")
      .update({ app_fee_percent: feePercent })
      .eq("id", settingsId);
    setSavingPct(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success(`Taxa salva: ${feePercent}%`);
  };

  const totals = useMemo(() => {
    const totalOrders = deliveries.reduce((a, d) => a + Number(d.order_value || 0), 0);
    const totalFee = deliveries.reduce((a, d) => a + Number(d.app_fee || 0), 0);
    const collected = deliveries
      .filter((d) => d.status === "concluida")
      .reduce((a, d) => a + Number(d.app_fee || 0), 0);
    return { totalOrders, totalFee, collected };
  }, [deliveries]);

  const byPartner = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; total: number; fee: number }>();
    deliveries.forEach((d) => {
      const key = d.partner_id || d.partner_name;
      const cur = map.get(key) || { name: d.partner_name, orders: 0, total: 0, fee: 0 };
      cur.orders += 1;
      cur.total += Number(d.order_value || 0);
      cur.fee += Number(d.app_fee || 0);
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.fee - a.fee);
  }, [deliveries]);

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground flex items-center gap-2">
          <Percent size={16} className="text-primary" /> Taxas de entrega ({feePercent}%)
        </h3>
        <button onClick={load} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Configuração da porcentagem */}
      <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
        <p className="text-xs font-bold text-foreground">Porcentagem da taxa do app</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={feePercent}
            onChange={(e) => setFeePercent(Number(e.target.value))}
            className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm font-bold"
          />
          <span className="text-sm font-black text-muted-foreground">%</span>
          <button
            onClick={savePercent}
            disabled={savingPct}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60"
          >
            <Save size={12} /> {savingPct ? "..." : "Salvar"}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Aplicada automaticamente em pedidos de lojas que usam entregador do app.
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
        💡 Cobrança manual. Estes valores são apenas referência para cobrar dos parceiros depois.
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground">Pedidos</p>
          <p className="text-base font-black text-foreground">R$ {totals.totalOrders.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground">Taxa total</p>
          <p className="text-base font-black text-primary">R$ {totals.totalFee.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3">
          <p className="text-[10px] text-muted-foreground">A cobrar (concluídas)</p>
          <p className="text-base font-black text-green-600">R$ {totals.collected.toFixed(2)}</p>
        </div>
      </div>

      {byPartner.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
          <p className="text-xs font-bold text-foreground flex items-center gap-1">
            <Store size={12} /> Por parceiro
          </p>
          {byPartner.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-xs border-t border-border pt-2 first:border-t-0 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.orders} pedido(s) · R$ {p.total.toFixed(2)}</p>
              </div>
              <p className="font-black text-primary">R$ {p.fee.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {deliveries.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">Nenhuma taxa registrada ainda 📊</p>
        )}
        {deliveries.map((d) => {
          const s = STATUS_LABEL[d.status] || STATUS_LABEL.disponivel;
          return (
            <div key={d.id} className="bg-card rounded-2xl border border-border p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{d.partner_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.order_description}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${s.color}`}>{s.label}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Pedido: <b className="text-foreground">R$ {Number(d.order_value).toFixed(2)}</b></span>
                <span className="text-primary font-black">Taxa: R$ {Number(d.app_fee).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}