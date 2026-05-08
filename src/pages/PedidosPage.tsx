import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, ShoppingCart, ArrowRight, Trash2, Minus, Plus, Clock, CheckCircle2, Bike, ChefHat, Dumbbell, LogIn, Loader2, X, MessageCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OrderTrackingMap } from "@/components/OrderTrackingMap";
import { OrderStatusTimeline } from "@/components/OrderStatusTimeline";
import OrderChat from "@/components/OrderChat";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  partner_name: string;
  order_description: string;
  order_value: number;
  status: string;
  created_at: string;
  delivery_address: string;
  delivery_code: string | null;
  partner_id?: string | null;
  partner_address?: string | null;
  prep_status?: string | null;
  courier_id?: string | null;
  fulfillment_type?: string | null;
}

const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Aguardando", icon: Clock, color: "text-muted-foreground" },
  preparing: { label: "Em preparo", icon: ChefHat, color: "text-secondary" },
  in_progress: { label: "Em preparo", icon: ChefHat, color: "text-secondary" },
  picked_up: { label: "Saiu para entrega", icon: Bike, color: "text-primary" },
  on_the_way: { label: "Saiu para entrega", icon: Bike, color: "text-primary" },
  delivered: { label: "Finalizado", icon: CheckCircle2, color: "text-[hsl(142,70%,45%)]" },
  completed: { label: "Finalizado", icon: CheckCircle2, color: "text-[hsl(142,70%,45%)]" },
  cancelled: { label: "Cancelado", icon: Clock, color: "text-destructive" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PedidosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "historico" ? "historico" : "carrinho";
  const [tab, setTab] = useState<string>(initialTab);

  const { items, totalItems, totalValue, updateQty, removeItem, partnerName } = useCart();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [chatOrder, setChatOrder] = useState<OrderRow | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const openChat = async (o: OrderRow) => {
    setOpeningChat(true);
    setChatOrder(o);
    const { data, error } = await supabase.rpc("customer_get_or_create_chat", { _order_id: o.id });
    setOpeningChat(false);
    if (error || !data) { toast.error(error?.message || "Erro ao abrir conversa"); setChatOrder(null); return; }
    setChatId((data as any).id);
  };

  // tick a cada 15s para atualizar contadores
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const TIMEOUT_MIN = 5;

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancelar este pedido? Esta ação não pode ser desfeita.")) return;
    setCancellingId(id);
    const { error } = await supabase.rpc("customer_cancel_delivery", { _delivery_id: id });
    setCancellingId(null);
    if (error) { toast.error(error.message || "Não foi possível cancelar"); return; }
    toast.success("Pedido cancelado");
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelada" } : o));
  };

  const enrichWithPartnerAddress = async (rows: OrderRow[]): Promise<OrderRow[]> => {
    const ids = Array.from(new Set(rows.map((o) => o.partner_id).filter(Boolean))) as string[];
    if (ids.length === 0) return rows;
    const { data } = await supabase
      .from("partner_applications")
      .select("id, address")
      .in("id", ids);
    const map = new Map((data ?? []).map((p: any) => [p.id, p.address as string]));
    return rows.map((o) => ({ ...o, partner_address: o.partner_id ? map.get(o.partner_id) ?? null : null }));
  };

  useEffect(() => {
    setParams(tab === "historico" ? { tab: "historico" } : {}, { replace: true });
  }, [tab, setParams]);

  useEffect(() => {
    if (tab !== "historico") return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      // 1) Pedidos do usuário logado (user_id)
      const userOrders: OrderRow[] = [];
      if (user) {
        const { data } = await supabase.rpc("customer_list_orders");
        if (data) userOrders.push(...(data as OrderRow[]));
      }
      // 2) Fallback: pedidos legados salvos no localStorage (pré-login)
      const idsRaw = localStorage.getItem("escolheai_order_ids");
      const ids: string[] = idsRaw ? JSON.parse(idsRaw) : [];
      if (ids.length > 0) {
        const known = new Set(userOrders.map((o) => o.id));
        const missing = ids.filter((id) => !known.has(id));
        if (missing.length > 0) {
          const { data: legacy } = await supabase
            .from("deliveries")
            .select("id, partner_name, order_description, order_value, status, created_at, delivery_address, delivery_code, partner_id, prep_status, courier_id")
            .in("id", missing)
            .order("created_at", { ascending: false });
          if (legacy) userOrders.push(...(legacy as OrderRow[]));
        }
      }
      if (!cancelled) {
        const sorted = userOrders.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        const enriched = await enrichWithPartnerAddress(sorted);
        if (!cancelled) setOrders(enriched);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tab, user]);

  // Realtime: atualiza pedidos do usuário em tempo real
  useEffect(() => {
    if (!user || tab !== "historico") return;
    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "deliveries", filter: `user_id=eq.${user.id}` },
        () => {
          supabase.rpc("customer_list_orders").then(async ({ data }) => {
            if (data) setOrders(await enrichWithPartnerAddress(data as OrderRow[]));
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, tab]);

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="text-center mb-5 animate-bounce-in">
        <Package className="mx-auto text-primary mb-1" size={28} />
        <h1 className="text-2xl font-black text-foreground">Pedidos</h1>
        <p className="text-muted-foreground text-xs mt-1">Carrinho atual e histórico</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="max-w-sm mx-auto">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="carrinho" className="gap-1.5">
            <ShoppingCart size={14} /> Carrinho
            {totalItems > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                {totalItems}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <Package size={14} /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carrinho" className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10 animate-slide-up">
              <span className="text-5xl block mb-3">🛒</span>
              <p className="font-bold text-foreground">Carrinho vazio</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione produtos das lojas</p>
              <button
                onClick={() => navigate("/lojas")}
                className="mt-4 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-2xl text-sm active:scale-95 transition-transform"
              >
                Explorar lojas
              </button>
            </div>
          ) : (
            <>
              {partnerName && (
                <p className="text-xs text-muted-foreground">🏪 {partnerName}</p>
              )}
              {items.map((item) => (
                <div key={item.productId} className="rounded-2xl border border-border bg-card p-3 animate-slide-up">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">R${item.unitPrice.toFixed(2)} cada</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 active:scale-90"
                      aria-label="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90"
                        aria-label="Diminuir"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-black w-7 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90"
                        aria-label="Aumentar"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="text-sm font-black text-primary">
                      R${(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl bg-accent/40 p-3 flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase">Total</p>
                <p className="text-xl font-black text-primary">R${totalValue.toFixed(2)}</p>
              </div>

              <button
                onClick={() => navigate("/carrinho")}
                className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
              >
                Finalizar pedido <ArrowRight size={16} />
              </button>
            </>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4 space-y-2">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
          ) : !user ? (
            <div className="text-center py-10 animate-slide-up">
              <span className="text-5xl block mb-3">🔐</span>
              <p className="font-bold text-foreground">Entre pra ver seus pedidos</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Acompanhe status em tempo real e histórico completo
              </p>
              <button
                onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/pedidos?tab=historico")}`)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-2xl text-sm active:scale-95 transition-transform"
              >
                <LogIn size={14} /> Entrar
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 animate-slide-up">
              <span className="text-5xl block mb-3">📦</span>
              <p className="font-bold text-foreground">Nenhum pedido ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seus pedidos pelo app vão aparecer aqui
              </p>
            </div>
          ) : (
            <>
              {orders.map((o) => {
              const isFinal = ["concluida","completed","delivered","cancelled","cancelada"].includes(o.status);
              const isWaiting = o.status === "disponivel" && !o.courier_id;
              const elapsedMin = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
              const remaining = Math.max(0, TIMEOUT_MIN - elapsedMin);
              const timedOut = isWaiting && elapsedMin >= TIMEOUT_MIN;
              return (
                <div
                  key={o.id}
                  className="rounded-2xl border border-border bg-card p-3 animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        🏪 {o.partner_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    {o.fulfillment_type === "pickup" && (
                      <span className="text-[10px] font-black bg-orange-500/15 text-orange-700 border border-orange-500/30 px-2 py-1 rounded-lg whitespace-nowrap">
                        🛍 Retirar na loja
                      </span>
                    )}
                  </div>
                  {isWaiting && (
                    <div className={`mt-3 rounded-xl border-2 p-3 ${timedOut ? "bg-secondary/10 border-secondary/40" : "bg-primary/5 border-primary/30"}`}>
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className={`text-primary ${timedOut ? "" : "animate-spin"}`} />
                        <p className="text-xs font-black text-foreground">
                          {timedOut ? "Ainda procurando entregador..." : "Procurando um entregador para você"}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {timedOut
                          ? "Está demorando mais que o normal. Você pode aguardar mais um pouco ou cancelar o pedido."
                          : `Aguardando um entregador aceitar — tempo estimado ${remaining} min.`}
                      </p>
                      <button
                        onClick={() => cancelOrder(o.id)}
                        disabled={cancellingId === o.id}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <X size={12} /> {cancellingId === o.id ? "Cancelando..." : "Cancelar pedido"}
                      </button>
                    </div>
                  )}
                  <div className="mt-3">
                    <OrderStatusTimeline status={o.status} prepStatus={o.prep_status ?? undefined} />
                  </div>
                  {!isFinal && o.courier_id && (o.status === "aceita" || o.status === "em_andamento") && (
                    <p className="text-[11px] text-muted-foreground mt-2 italic">
                      Seu entregador pode entrar em contato caso necessário.
                    </p>
                  )}
                  {!isFinal && o.partner_id && (
                    <button
                      onClick={() => openChat(o)}
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-2 rounded-xl active:scale-95"
                    >
                      <MessageCircle size={14} /> Conversar com a loja
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2 whitespace-pre-line line-clamp-3">
                    {o.order_description}
                  </p>
                  {o.order_value > 0 && (
                    <p className="text-xs font-black text-primary mt-2">
                      Total: R${Number(o.order_value).toFixed(2)}
                    </p>
                  )}
                    {!isFinal && o.delivery_address && (
                      <div className="mt-3">
                        <OrderTrackingMap
                          storeAddress={o.partner_address ?? o.partner_name}
                          deliveryAddress={o.delivery_address}
                          height={200}
                        />
                      </div>
                    )}
                  {o.delivery_code && !isFinal && (
                    <div className="mt-3 rounded-xl bg-primary/10 border-2 border-dashed border-primary/40 p-3 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">🔐 Código de entrega</p>
                      <p className="text-2xl font-black text-primary tracking-[0.4em] mt-1">{o.delivery_code}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Informe ao entregador para finalizar</p>
                    </div>
                  )}
                </div>
              );
              })}

              <a
                href="https://shapeturbo.escolheai.today"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform animate-slide-up mt-3"
              >
                <div className="bg-gradient-to-br from-[hsl(280,70%,45%)] to-[hsl(24,95%,53%)] p-4 text-white relative overflow-hidden">
                  <div className="absolute -right-3 -top-3 opacity-20">
                    <Dumbbell size={80} strokeWidth={2.5} />
                  </div>
                  <div className="relative">
                    <p className="text-sm font-black leading-tight">
                      🔥 Aproveite e evolua seu corpo também
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-3 bg-white text-[hsl(280,70%,40%)] text-xs font-black px-3.5 py-2 rounded-full shadow-md">
                      Ir para Shape Turbo →
                    </span>
                  </div>
                </div>
              </a>
            </>
          )}
        </TabsContent>
      </Tabs>

      {chatOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={() => { setChatOrder(null); setChatId(null); }}>
          <div className="bg-background w-full sm:max-w-md sm:rounded-2xl overflow-hidden h-[85vh] sm:h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {openingChat || !chatId ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <OrderChat
                chatId={chatId}
                role="customer"
                title={`🏪 ${chatOrder.partner_name}`}
                subtitle={chatOrder.order_description.slice(0, 60)}
                onClose={() => { setChatOrder(null); setChatId(null); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}