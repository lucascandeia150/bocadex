import { useEffect, useRef, useState } from "react";
import { Bell, ShoppingBag, CheckCircle2, XCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Notif = {
  id: string;
  kind: "new_order" | "paid" | "cancelled";
  title: string;
  description: string;
  createdAt: string;
  deliveryId?: string;
};

const STORAGE_KEY = "admin_notifs_v1";
const READ_KEY = "admin_notifs_read_v1";

function loadList(): Notif[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveList(list: Notif[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
}
function loadRead(): string[] {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || "[]"); } catch { return []; }
}
function saveRead(ids: string[]) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-200)));
}

export default function AdminNotificationCenter() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notif[]>(() => loadList());
  const [read, setRead] = useState<string[]>(() => loadRead());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialLoad = useRef(true);

  const push = (n: Notif, playSound: boolean) => {
    setList((prev) => {
      if (prev.some((x) => x.id === n.id)) return prev;
      const next = [n, ...prev].slice(0, 50);
      saveList(next);
      return next;
    });
    if (playSound) {
      try { audioRef.current?.play().catch(() => {}); } catch { /* noop */ }
    }
  };

  // Subscribe to deliveries (new orders / cancellations) and payments (approved)
  useEffect(() => {
    const ch = supabase.channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deliveries" }, (payload) => {
        const d = payload.new as { id: string; partner_name: string; order_description: string; created_at: string };
        push({
          id: `new-${d.id}`,
          kind: "new_order",
          title: `Novo pedido · ${d.partner_name}`,
          description: d.order_description?.slice(0, 80) || "Pedido recebido",
          createdAt: d.created_at,
          deliveryId: d.id,
        }, !initialLoad.current);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deliveries", filter: "status=eq.cancelada" }, (payload) => {
        const d = payload.new as { id: string; partner_name: string };
        push({
          id: `cancel-${d.id}-${Date.now()}`,
          kind: "cancelled",
          title: `Pedido cancelado · ${d.partner_name}`,
          description: "Status alterado para cancelada",
          createdAt: new Date().toISOString(),
          deliveryId: d.id,
        }, !initialLoad.current);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "payments", filter: "status=eq.approved" }, (payload) => {
        const p = payload.new as { id: string; customer_name: string; amount: number };
        push({
          id: `paid-${p.id}-${Date.now()}`,
          kind: "paid",
          title: `Pagamento aprovado`,
          description: `${p.customer_name} · R$ ${Number(p.amount || 0).toFixed(2)}`,
          createdAt: new Date().toISOString(),
        }, !initialLoad.current);
      })
      .subscribe(() => { initialLoad.current = false; });
    return () => { supabase.removeChannel(ch); };
  }, []);

  const unread = list.filter((n) => !read.includes(n.id)).length;

  const markAllRead = () => {
    const ids = list.map((n) => n.id);
    setRead(ids);
    saveRead(ids);
  };

  const handleClick = (n: Notif) => {
    if (!read.includes(n.id)) {
      const next = [...read, n.id];
      setRead(next);
      saveRead(next);
    }
    if (n.deliveryId) navigate(`/admin/dashboard/orders/${n.deliveryId}`);
    setOpen(false);
  };

  const clear = () => { setList([]); saveList([]); };

  return (
    <div className="relative">
      {/* Soft chime (free, embedded) */}
      <audio ref={audioRef} preload="auto" src="data:audio/mp3;base64,SUQzAwAAAAAAJlRJVDIAAAAcAAAAQ2hpbWUAVENPTQAAAAUAAABMb3ZhYmxlAA==" />
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-in zoom-in">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-black text-foreground">Notificações</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">
                    Marcar lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {list.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto text-muted-foreground mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Sem notificações ainda.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Você verá novos pedidos e pagamentos em tempo real.</p>
                </div>
              ) : list.map((n) => {
                const isRead = read.includes(n.id);
                const Icon = n.kind === "paid" ? CheckCircle2 : n.kind === "cancelled" ? XCircle : ShoppingBag;
                const color = n.kind === "paid" ? "text-green-600 bg-green-500/10" : n.kind === "cancelled" ? "text-red-600 bg-red-500/10" : "text-primary bg-primary/10";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors ${isRead ? "opacity-60" : ""}`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                    {!isRead && <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />}
                  </button>
                );
              })}
            </div>
            {list.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-muted/30">
                <button onClick={clear} className="text-[10px] font-bold text-muted-foreground hover:text-destructive">
                  Limpar todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
