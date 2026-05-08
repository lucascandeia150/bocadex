import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, User, Phone, Receipt, CreditCard, Truck, RefreshCw,
  CheckCircle2, XCircle, Clock, AlertTriangle, Package, ScrollText, Copy, RotateCcw,
} from "lucide-react";

interface Delivery {
  id: string;
  partner_id: string | null;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  status: string;
  fee: number;
  app_fee: number;
  order_value: number;
  courier_payout: number;
  courier_id: string | null;
  payment_id: string | null;
  delivery_code: string | null;
  created_at: string;
  updated_at: string;
}
interface Payment {
  id: string;
  status: string;
  amount: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  order_description: string;
  external_reference: string;
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  partner_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
interface AuditLog {
  id: string;
  actor_type: string;
  actor_label: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const STATUS_INFO: Record<string, { label: string; cls: string; icon: any }> = {
  disponivel: { label: "Aguardando", cls: "bg-blue-500/10 text-blue-600", icon: Clock },
  aceita: { label: "Aceita", cls: "bg-yellow-500/10 text-yellow-600", icon: Package },
  em_andamento: { label: "A caminho", cls: "bg-orange-500/10 text-orange-600", icon: Truck },
  concluida: { label: "Concluída", cls: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", cls: "bg-red-500/10 text-red-600", icon: XCircle },
};

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Aprovado", cls: "bg-green-500/10 text-green-600" },
  pending: { label: "Pendente", cls: "bg-yellow-500/10 text-yellow-600" },
  in_process: { label: "Processando", cls: "bg-blue-500/10 text-blue-600" },
  rejected: { label: "Rejeitado", cls: "bg-red-500/10 text-red-600" },
  cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
  refunded: { label: "Reembolsado", cls: "bg-purple-500/10 text-purple-600" },
  partially_refunded: { label: "Reembolso parcial", cls: "bg-purple-500/10 text-purple-600" },
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [couriers, setCouriers] = useState<Array<{ id: string; name: string; is_online: boolean; vehicle: string }>>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_list_active_couriers").then(({ data }) => {
      if (data) setCouriers(data as any);
    });
  }, []);

  const assignCourier = async (courierId: string) => {
    if (!delivery || !courierId) return;
    setAssigning(true);
    const { error } = await supabase.rpc("admin_assign_courier", {
      _delivery_id: delivery.id, _courier_id: courierId,
    });
    setAssigning(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Entregador atribuído");
    await supabase.rpc("log_audit_event", {
      _actor_type: "admin", _actor_id: null, _actor_label: "Admin",
      _action: "delivery.courier.assigned", _entity_type: "delivery",
      _entity_id: delivery.id,
      _description: `Atribuído ao entregador ${courierId}`,
      _metadata: { courier_id: courierId },
    });
    load();
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: d } = await supabase
      .from("deliveries").select("*").eq("id", id).maybeSingle();
    setDelivery(d as Delivery);

    let p: Payment | null = null;
    if (d?.payment_id) {
      const { data: pp } = await supabase.from("payments").select("*").eq("id", d.payment_id).maybeSingle();
      p = pp as Payment | null;
    }
    setPayment(p);

    const ids = [id, d?.payment_id].filter(Boolean) as string[];
    if (ids.length) {
      const { data: l } = await supabase
        .from("admin_audit_logs").select("*").in("entity_id", ids).order("created_at", { ascending: false }).limit(50);
      setLogs((l as AuditLog[]) || []);
    } else {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // Realtime: refletir mudanças
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`admin-order-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_audit_logs" }, (payload: any) => {
        if (payload?.new?.entity_id === id || (payment && payload?.new?.entity_id === payment.id)) load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [id, payment?.id]);

  const fmt = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const updateStatus = async (newStatus: string) => {
    if (!delivery) return;
    const { error } = await supabase.from("deliveries").update({ status: newStatus }).eq("id", delivery.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Status atualizado");
    await supabase.rpc("log_audit_event", {
      _actor_type: "admin", _actor_id: null, _actor_label: "Admin",
      _action: `delivery.status.${newStatus}`, _entity_type: "delivery",
      _entity_id: delivery.id, _description: `Status alterado para ${newStatus}`,
      _metadata: { from: delivery.status, to: newStatus },
    });
    load();
  };

  const doRefund = async () => {
    if (!payment) return;
    setRefunding(true);
    try {
      const amt = refundAmount ? Number(refundAmount.replace(",", ".")) : undefined;
      if (amt !== undefined && (isNaN(amt) || amt <= 0)) {
        toast.error("Valor inválido");
        return;
      }
      const { data, error } = await supabase.functions.invoke("mp-refund", {
        body: { payment_id: payment.id, amount: amt, reason: refundReason },
      });
      if (error) throw error;
      const r = data as any;
      if (r?.error) throw new Error(r.error);
      toast.success(r?.full ? "Reembolso total realizado" : `Reembolso de ${fmt(r?.amount || 0)} realizado`);
      setRefundOpen(false);
      setRefundAmount(""); setRefundReason("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao reembolsar");
    } finally {
      setRefunding(false);
    }
  };

  const copy = (v: string, label: string) => {
    navigator.clipboard.writeText(v);
    toast.success(`${label} copiado`);
  };

  const timeline = useMemo(() => {
    if (!delivery) return [];
    const items: { ts: string; label: string; desc?: string }[] = [
      { ts: delivery.created_at, label: "Pedido criado" },
    ];
    if (payment) {
      items.push({ ts: payment.created_at, label: "Pagamento iniciado", desc: payment.external_reference });
      if (payment.status === "approved" || payment.status === "refunded" || payment.status === "partially_refunded") {
        items.push({ ts: payment.updated_at, label: `Pagamento ${PAYMENT_STATUS[payment.status]?.label || payment.status}` });
      }
    }
    logs.forEach((l) => items.push({ ts: l.created_at, label: l.action, desc: l.description }));
    return items.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [delivery, payment, logs]);

  if (loading) {
    return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>;
  }
  if (!delivery) {
    return (
      <div className="space-y-4">
        <Link to="/admin/dashboard/orders" className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft size={12} /> Voltar</Link>
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <AlertTriangle className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_INFO[delivery.status] || STATUS_INFO.disponivel;
  const StatusIcon = status.icon;
  const canRefund = payment && payment.mp_payment_id &&
    (payment.status === "approved" || payment.status === "partially_refunded");
  const canCancel = delivery.status !== "concluida" && delivery.status !== "cancelada";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link to="/admin/dashboard/orders" className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Voltar para pedidos
        </Link>
        <button onClick={load} className="p-2 rounded-lg bg-muted hover:bg-muted/70" title="Atualizar"><RefreshCw size={14} /></button>
      </div>

      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1 ${status.cls}`}>
                <StatusIcon size={12} /> {status.label}
              </span>
              {payment && (
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${PAYMENT_STATUS[payment.status]?.cls || "bg-muted text-muted-foreground"}`}>
                  {PAYMENT_STATUS[payment.status]?.label || payment.status}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-foreground">{delivery.partner_name}</h1>
            <p className="text-sm text-muted-foreground">{delivery.order_description}</p>
            <button onClick={() => copy(delivery.id, "ID do pedido")} className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1">
              ID: {delivery.id.slice(0, 8)}... <Copy size={9} />
            </button>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-foreground">{fmt(Number(delivery.order_value))}</p>
            <p className="text-[11px] text-muted-foreground">taxa app: {fmt(Number(delivery.app_fee))}</p>
            <p className="text-[11px] text-muted-foreground">entregador: {fmt(Number(delivery.fee))}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <select
            value={delivery.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="text-xs bg-muted rounded-lg px-3 py-2 font-bold"
          >
            {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {canRefund && (
            <button onClick={() => setRefundOpen(true)} className="flex items-center gap-1 text-xs font-bold bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 px-3 py-2 rounded-lg">
              <RotateCcw size={12} /> Reembolsar
            </button>
          )}
          {canCancel && (
            <button onClick={() => updateStatus("cancelada")} className="flex items-center gap-1 text-xs font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 px-3 py-2 rounded-lg">
              <XCircle size={12} /> Cancelar pedido
            </button>
          )}
        </div>

        {/* Atribuição manual de entregador */}
        {delivery.status !== "concluida" && delivery.status !== "cancelada" && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-black text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Truck size={11} /> Entregador {delivery.courier_id ? "(reatribuir)" : "(atribuir manualmente)"}
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={delivery.courier_id || ""}
                onChange={(e) => e.target.value && assignCourier(e.target.value)}
                disabled={assigning}
                className="text-xs bg-background border border-border rounded-lg px-3 py-2 font-bold flex-1 min-w-[180px]"
              >
                <option value="">— Selecione um entregador —</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.is_online ? "🟢 " : "⚪ "} {c.name} · {c.vehicle}
                  </option>
                ))}
              </select>
            </div>
            {couriers.filter((c) => c.is_online).length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Nenhum entregador online no momento. Você ainda pode atribuir manualmente.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cliente + Entrega */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1"><User size={11} /> Cliente</p>
          <p className="text-sm font-bold text-foreground">{payment?.customer_name || "—"}</p>
          {payment?.customer_phone && (
            <button onClick={() => copy(payment.customer_phone, "Telefone")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Phone size={11} /> {payment.customer_phone} <Copy size={9} />
            </button>
          )}
          {payment?.customer_phone && (
            <a
              href={`https://wa.me/55${payment.customer_phone.replace(/\D/g, "")}`}
              target="_blank" rel="noreferrer"
              className="inline-block text-[11px] font-bold text-green-600 hover:underline"
            >
              Abrir no WhatsApp →
            </a>
          )}
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1"><MapPin size={11} /> Entrega</p>
          <p className="text-sm text-foreground">{delivery.delivery_address}</p>
          {delivery.notes && <p className="text-xs text-muted-foreground italic">"{delivery.notes}"</p>}
          {delivery.delivery_code && (
            <p className="text-[11px] text-muted-foreground">Código: <span className="font-black text-primary tracking-widest">{delivery.delivery_code}</span></p>
          )}
        </div>
      </div>

      {/* Pagamento */}
      {payment && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-black text-muted-foreground uppercase mb-3 flex items-center gap-1"><CreditCard size={11} /> Pagamento</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <KV label="Valor" value={fmt(Number(payment.amount))} />
            <KV
              label="External Ref"
              value={payment.external_reference ? `${payment.external_reference.slice(0, 16)}...` : "—"}
              onCopy={payment.external_reference ? () => copy(payment.external_reference, "Referência") : undefined}
            />
            <KV label="MP Payment ID" value={payment.mp_payment_id || "—"} onCopy={payment.mp_payment_id ? () => copy(payment.mp_payment_id!, "ID MP") : undefined} />
            <KV label="Criado" value={new Date(payment.created_at).toLocaleString("pt-BR")} />
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-black text-muted-foreground uppercase mb-3 flex items-center gap-1"><ScrollText size={11} /> Linha do tempo</p>
        <ol className="relative border-l border-border ml-2 space-y-3">
          {timeline.map((t, i) => (
            <li key={i} className="ml-4">
              <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
              <p className="text-xs font-bold text-foreground">{t.label}</p>
              {t.desc && <p className="text-[11px] text-muted-foreground">{t.desc}</p>}
              <p className="text-[10px] text-muted-foreground/70">{new Date(t.ts).toLocaleString("pt-BR")}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Audit logs */}
      {logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-black text-muted-foreground uppercase mb-3 flex items-center gap-1"><Receipt size={11} /> Auditoria deste pedido</p>
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="py-2 text-xs flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">{l.action}</span>
                <span className="text-muted-foreground">{l.description}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund modal */}
      {refundOpen && payment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4" onClick={() => !refunding && setRefundOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-lg font-black text-foreground">Reembolsar pagamento</h3>
              <p className="text-xs text-muted-foreground">Valor original: {fmt(Number(payment.amount))} · Cliente: {payment.customer_name}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Valor (deixe vazio para reembolso total)</label>
              <input
                type="text" inputMode="decimal"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Ex: ${Number(payment.amount).toFixed(2)}`}
                className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Motivo (opcional)</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={2}
                placeholder="Ex: cliente desistiu, item indisponível..."
                className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-xl p-3 text-xs flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>O valor será estornado pelo Mercado Pago em até alguns dias úteis. A entrega será marcada como cancelada se ainda não estiver concluída.</span>
            </div>
            <div className="flex gap-2">
              <button disabled={refunding} onClick={() => setRefundOpen(false)} className="flex-1 text-sm font-bold bg-muted hover:bg-muted/70 rounded-xl py-2.5 disabled:opacity-50">
                Cancelar
              </button>
              <button disabled={refunding} onClick={doRefund} className="flex-1 text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-xl py-2.5 disabled:opacity-50">
                {refunding ? "Reembolsando..." : "Confirmar reembolso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <button
        onClick={onCopy}
        disabled={!onCopy}
        className={`text-xs font-bold text-foreground truncate w-full text-left ${onCopy ? "hover:text-primary cursor-pointer" : "cursor-default"} flex items-center gap-1`}
      >
        {value} {onCopy && <Copy size={9} className="shrink-0" />}
      </button>
    </div>
  );
}