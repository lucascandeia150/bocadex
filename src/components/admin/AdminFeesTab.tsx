import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Percent, RefreshCw, Store } from "lucide-react";

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

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("deliveries")
      .select("id, partner_id, partner_name, order_description, order_value, app_fee, status, created_at")
      .gt("app_fee", 0)
      .order("created_at", { ascending: false });
    setDeliveries((data as Delivery[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
          <Percent size={16} className="text-primary" /> Taxas de entrega (8%)
        </h3>
        <button onClick={load} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
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
                <span className="text-primary font-black">Taxa 8%: R$ {Number(d.app_fee).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}