import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Plus, RefreshCw, MapPin, Truck, ArrowLeft, LogOut, Star, X, Package, Settings, Mail, Lock, KeyRound, BarChart3, ChefHat, Bike, CheckCircle2, Power, Clock, DollarSign, Bell, Pause, Play, Ban, MessageCircle } from "lucide-react";
import PartnerProductsTab from "@/components/portal/PartnerProductsTab";
import PartnerStoreTab from "@/components/portal/PartnerStoreTab";
import PartnerDashboardTab from "@/components/portal/PartnerDashboardTab";
import PartnerChatsTab from "@/components/portal/PartnerChatsTab";

interface Partner {
  id: string;
  business_name: string;
  address: string;
  whatsapp: string;
  uses_app_courier?: boolean;
  is_open?: boolean;
  is_demo?: boolean;
  store_status?: string;
}

interface Delivery {
  id: string;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  status: string;
  courier_id: string | null;
  created_at: string;
  order_value?: number;
  prep_status?: string;
  fulfillment_type?: string | null;
  user_id?: string | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  disponivel: { label: "💰 Pago — pendente", color: "bg-blue-500/10 text-blue-600" },
  aceita: { label: "👨‍🍳 Em preparo", color: "bg-yellow-500/10 text-yellow-600" },
  em_andamento: { label: "🛵 Saiu p/ entrega", color: "bg-orange-500/10 text-orange-600" },
  concluida: { label: "✅ Entregue", color: "bg-green-500/10 text-green-600" },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-600" },
};

const PIN_KEY = "escolheai_partner_pin";

export default function PortalLojaPage() {
  const [pin, setPin] = useState("");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"dash" | "list" | "new" | "products" | "store" | "chats">("dash");
  const [orderFilter, setOrderFilter] = useState<"all" | "pickup" | "delivery">("all");
  const [chatUnread, setChatUnread] = useState(0);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  const [rateModal, setRateModal] = useState<Delivery | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  // Auth (email/senha)
  const [authMode, setAuthMode] = useState<"email" | "pin">("email");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkPin, setLinkPin] = useState("");
  const [needsLink, setNeedsLink] = useState(false);

  // form
  const [orderDesc, setOrderDesc] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [orderValue, setOrderValue] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(PIN_KEY);
    if (saved) {
      setPin(saved);
      tryLogin(saved, true);
    }
    // Auto-restore from auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !saved) {
        resolvePinFromUser(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !partner) {
        // defer to avoid deadlock
        setTimeout(() => resolvePinFromUser(session.user.id), 0);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After auth login, find the partner linked to this user_id and reuse the existing PIN-based RPCs
  const resolvePinFromUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("partner_applications")
      .select("access_pin")
      .eq("user_id", userId)
      .eq("status", "approved")
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data?.access_pin) {
      setNeedsLink(true);
      return;
    }
    setNeedsLink(false);
    setPin(data.access_pin);
    tryLogin(data.access_pin, true);
  };

  const signIn = async () => {
    if (!email || !password) { toast.error("Preencha email e senha"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Login realizado ✅");
  };

  const signUp = async () => {
    if (!email || password.length < 6) { toast.error("Email e senha (mín. 6) obrigatórios"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/portal-loja` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Cadastro feito! Verifique seu email para confirmar.");
    setAuthTab("signin");
  };

  const linkAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { toast.error("Faça login primeiro"); return; }
    if (linkPin.length !== 6) { toast.error("Informe o PIN de 6 dígitos"); return; }
    setLoading(true);
    const { error } = await supabase.rpc("partner_link_user", { _pin: linkPin, _user_id: session.user.id });
    setLoading(false);
    if (error) { toast.error(error.message || "Erro ao vincular"); return; }
    toast.success("Conta vinculada à loja ✅");
    setNeedsLink(false);
    setPin(linkPin);
    tryLogin(linkPin, true);
  };

  const tryLogin = async (code: string, silent = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_login", { _pin: code });
    setLoading(false);
    if (error || !data || data.length === 0) {
      if (!silent) toast.error("PIN inválido");
      localStorage.removeItem(PIN_KEY);
      setPartner(null);
      return;
    }
    const p = data[0] as any;
    const merged: Partner = {
      id: p.id,
      business_name: p.business_name,
      address: p.address,
      whatsapp: p.whatsapp,
      uses_app_courier: !!p.uses_app_courier,
      is_open: p.is_open !== false,
      is_demo: !!p.is_demo,
      store_status: p.store_status || "active",
    };
    setPartner(merged);
    setAddress(p.address);
    localStorage.setItem(PIN_KEY, code);
    loadDeliveries(code);
  };

  const loadDeliveries = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_list_deliveries", { _pin: code });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar pedidos"); return; }
    const list = (data as Delivery[]) || [];
    setDeliveries(list);
    // load ratings already done
    const ids = list.filter((d) => d.status === "concluida").map((d) => d.id);
    if (ids.length > 0) {
      const { data: rs } = await supabase.from("ratings").select("delivery_id").in("delivery_id", ids);
      setRatedIds(new Set((rs || []).map((r: any) => r.delivery_id)));
    }
  };

  // Realtime: atualizar pedidos da loja
  useEffect(() => {
    if (!partner || !pin) return;
    const channel = supabase
      .channel("partner-deliveries")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deliveries", filter: `partner_id=eq.${partner.id}` }, () => {
        toast.success("📦 Novo pedido recebido!");
        loadDeliveries(pin);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deliveries", filter: `partner_id=eq.${partner.id}` }, (payload: any) => {
        const oldStatus = payload.old?.status;
        const newStatus = payload.new?.status;
        if (oldStatus !== newStatus) {
          if (newStatus === "aceita") toast.success("✅ Pedido aceito pelo entregador");
          else if (newStatus === "em_andamento") toast.success("🛵 Saiu para entrega!");
          else if (newStatus === "concluida") toast.success("🎉 Pedido finalizado!");
          else if (newStatus === "cancelada") toast.error("❌ Pedido cancelado");
        }
        loadDeliveries(pin);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partner, pin]);

  // Track unread chats badge
  useEffect(() => {
    if (!partner) return;
    const refresh = async () => {
      const { data } = await supabase.rpc("partner_list_chats", { _pin: pin });
      const total = ((data as any[]) || []).reduce((s, c) => s + (c.partner_unread || 0), 0);
      setChatUnread(total);
    };
    refresh();
    const ch = supabase
      .channel(`partner-chat-badge-${partner.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chats", filter: `partner_id=eq.${partner.id}` },
        () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [partner, pin]);

  const submitRating = async () => {
    if (!rateModal) return;
    const { error } = await supabase.rpc("partner_rate_courier", {
      _pin: pin,
      _delivery_id: rateModal.id,
      _stars: stars,
      _comment: comment.trim(),
    });
    if (error) { toast.error(error.message || "Erro ao avaliar"); return; }
    toast.success("Avaliação enviada ⭐");
    setRatedIds((prev) => new Set([...prev, rateModal.id]));
    setRateModal(null);
    setStars(5);
    setComment("");
  };

  const advanceStatus = async (deliveryId: string, next: "aceita" | "em_andamento" | "concluida" | "cancelada") => {
    const { error } = await supabase.rpc("partner_advance_delivery_status", {
      _pin: pin,
      _delivery_id: deliveryId,
      _next_status: next,
    });
    if (error) {
      toast.error(error.message || "Não foi possível atualizar o pedido");
      return;
    }
    const target = deliveries.find((d) => d.id === deliveryId);
    const isPickup = target?.fulfillment_type === "pickup";
    const labels: Record<string, string> = {
      aceita: "Pedido em preparo 👨‍🍳",
      em_andamento: isPickup ? "Pronto para retirada 🛍" : "Saiu para entrega 🛵",
      concluida: isPickup ? "Retirado pelo cliente ✅" : "Pedido entregue ✅",
      cancelada: "Pedido cancelado",
    };
    toast.success(labels[next]);
    // Push to customer when pickup order is ready
    if (isPickup && next === "em_andamento") {
      try {
        await supabase.functions.invoke("partner-notify-pickup", {
          body: { pin, delivery_id: deliveryId },
        });
      } catch (e) { console.warn("push pickup ready falhou", e); }
    }
    loadDeliveries(pin);
  };

  const callCourier = async (deliveryId: string) => {
    const { error } = await supabase.rpc("partner_advance_prep", {
      _pin: pin,
      _delivery_id: deliveryId,
      _next: "ready",
    });
    if (error) { toast.error(error.message || "Erro ao chamar entregador"); return; }
    toast.success("🚚 Entregador chamado! Pedido visível para entregadores.");
    loadDeliveries(pin);
  };

  const logout = async () => {
    localStorage.removeItem(PIN_KEY);
    setPartner(null);
    setPin("");
    setDeliveries([]);
    setNeedsLink(false);
    await supabase.auth.signOut();
  };

  const submit = async () => {
    if (!orderDesc.trim() || !address.trim()) {
      toast.error("Preencha pedido e endereço");
      return;
    }
    if (partner?.uses_app_courier && (!orderValue || orderValue <= 0)) {
      toast.error("Informe o valor do pedido (necessário para a taxa de 8%)");
      return;
    }
    if (partner?.uses_app_courier) {
      const ok = window.confirm(
        `Este pedido utilizará entregador parceiro.\n\nSerá aplicada taxa de 8% sobre o valor do pedido (R$ ${(orderValue * 0.08).toFixed(2)}).\n\nDeseja continuar?`
      );
      if (!ok) return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("partner_create_delivery", {
      _pin: pin,
      _order_description: orderDesc.trim(),
      _delivery_address: address.trim(),
      _notes: notes.trim(),
      _fee: fee,
      _order_value: orderValue,
    });
    setLoading(false);
    if (error) { toast.error("Erro ao enviar pedido"); return; }
    toast.success("Pedido enviado ✅");
    setOrderDesc(""); setNotes(""); setFee(0); setOrderValue(0);
    setAddress(partner?.address || "");
    setTab("list");
    loadDeliveries(pin);
  };

  if (!partner) {
    // Step: needs to link auth user to a partner via PIN
    if (needsLink) {
      return (
        <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
            <KeyRound className="mx-auto text-primary" size={36} />
            <h1 className="text-lg font-black text-foreground">Vincular conta à loja</h1>
            <p className="text-xs text-muted-foreground">Sua conta ainda não está vinculada. Informe o PIN de 6 dígitos da sua loja para vincular permanentemente.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={linkPin}
              onChange={(e) => setLinkPin(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-2xl font-black tracking-widest bg-muted rounded-xl px-3 py-3"
            />
            <button
              disabled={loading || linkPin.length !== 6}
              onClick={linkAccount}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? "Vinculando..." : "Vincular"}
            </button>
            <button onClick={logout} className="text-[11px] text-muted-foreground underline">
              Sair
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
        <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </a>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
          <Store className="mx-auto text-primary" size={40} />
          <h1 className="text-lg font-black text-foreground">Portal da Loja</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setAuthMode("email")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${authMode === "email" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              <Mail size={12} className="inline mr-1" /> Email
            </button>
            <button
              onClick={() => setAuthMode("pin")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${authMode === "pin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              <KeyRound size={12} className="inline mr-1" /> PIN
            </button>
          </div>

          {authMode === "pin" ? (
            <>
              <p className="text-xs text-muted-foreground">Digite o PIN de 6 dígitos fornecido pelo administrador.</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-2xl font-black tracking-widest bg-muted rounded-xl px-3 py-3"
              />
              <button
                disabled={loading || pin.length !== 6}
                onClick={() => tryLogin(pin)}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthTab("signin")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold ${authTab === "signin" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setAuthTab("signup")}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold ${authTab === "signup" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  Criar conta
                </button>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@loja.com"
                className="w-full bg-muted rounded-xl px-3 py-3 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha (mín. 6)"
                className="w-full bg-muted rounded-xl px-3 py-3 text-sm"
              />
              <button
                disabled={loading}
                onClick={authTab === "signin" ? signIn : signUp}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
              >
                {loading ? "Aguarde..." : authTab === "signin" ? "Entrar" : "Criar conta"}
              </button>
              <p className="text-[10px] text-muted-foreground">
                Após o primeiro login, você precisará informar o PIN da loja uma única vez para vincular sua conta.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const newOrdersCount = deliveries.filter(d => d.status === "disponivel").length;

  const toggleStoreOpen = async () => {
    if (partner?.store_status === "blocked") {
      toast.error("Loja bloqueada pelo administrador");
      return;
    }
    if (partner?.store_status === "paused") {
      toast.error("Loja pausada — retome a operação para abrir");
      return;
    }
    const { data, error } = await supabase.rpc("partner_toggle_open", { _pin: pin });
    if (error) { toast.error(error.message || "Erro"); return; }
    const s = data as any;
    setPartner((prev) => prev ? { ...prev, is_open: s.is_open } : prev);
    toast.success(s.is_open ? "🟢 Loja aberta" : "🔴 Loja fechada");
  };

  const togglePause = async () => {
    if (!partner) return;
    if (partner.store_status === "blocked") {
      toast.error("Loja bloqueada pelo administrador. Entre em contato com o suporte.");
      return;
    }
    const willPause = partner.store_status !== "paused";
    if (willPause && !window.confirm("Pausar operação? Sua loja deixará de receber pedidos até você retomar.")) return;
    const { data, error } = await supabase.rpc("partner_set_pause", { _pin: pin, _paused: willPause });
    if (error) { toast.error(error.message || "Erro"); return; }
    const s = data as any;
    setPartner((prev) => prev ? { ...prev, store_status: s.store_status, is_open: s.is_open } : prev);
    toast.success(willPause ? "⏸️ Operação pausada" : "▶️ Operação retomada");
  };

  const tabs: { id: typeof tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dash", label: "Início", icon: <BarChart3 size={16} /> },
    { id: "list", label: "Pedidos", icon: <Package size={16} />, badge: newOrdersCount },
    { id: "new", label: "Novo", icon: <Plus size={16} /> },
    { id: "chats", label: "Conversas", icon: <MessageCircle size={16} />, badge: chatUnread },
    { id: "products", label: "Cardápio", icon: <ChefHat size={16} /> },
    { id: "store", label: "Loja", icon: <Settings size={16} /> },
  ];

  return (
    <div className="max-w-md mx-auto animate-slide-up pb-4">
      {/* Sticky branded header */}
      <div className="sticky top-14 z-30 bg-gradient-to-br from-primary via-primary to-orange-500 text-primary-foreground px-4 pt-4 pb-5 rounded-b-3xl shadow-lg shadow-primary/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Portal da loja</p>
            <h1 className="text-lg font-black truncate flex items-center gap-2">
              {partner.business_name}
              {partner.is_demo && (
                <span className="text-[9px] font-black bg-white text-orange-600 px-1.5 py-0.5 rounded-full">🧪 DEMO</span>
              )}
            </h1>
          </div>
          <button onClick={logout} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all" title="Sair">
            <LogOut size={14} />
          </button>
        </div>
        {partner.is_demo && (
          <p className="mt-2 text-[11px] bg-white/15 rounded-lg px-2 py-1.5 font-semibold">
            ⚠️ Modo demonstração — dados não são reais.
          </p>
        )}

        {partner.store_status === "blocked" && (
          <p className="mt-2 text-[11px] bg-red-500/30 border border-white/20 rounded-lg px-2 py-1.5 font-bold flex items-center gap-1">
            <Ban size={12} /> Loja bloqueada pelo administrador. Entre em contato com o suporte.
          </p>
        )}
        {partner.store_status === "paused" && (
          <p className="mt-2 text-[11px] bg-yellow-500/30 border border-white/20 rounded-lg px-2 py-1.5 font-bold flex items-center gap-1">
            <Pause size={12} /> Operação pausada — você não está recebendo pedidos.
          </p>
        )}

        {/* Open/Close toggle */}
        <button
          onClick={toggleStoreOpen}
          disabled={partner.store_status === "blocked" || partner.store_status === "paused"}
          className={`mt-3 w-full flex items-center justify-between gap-2 rounded-2xl px-4 py-2.5 font-bold text-xs active:scale-[.98] transition-all ${
            partner.is_open
              ? "bg-white text-green-600 shadow-md"
              : "bg-red-500/90 text-white"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <span className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${partner.is_open ? "bg-green-500" : "bg-white"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${partner.is_open ? "bg-green-500" : "bg-white"}`}></span>
            </span>
            {partner.is_open ? "Loja aberta — recebendo pedidos" : "Loja fechada"}
          </span>
          <span className="flex items-center gap-1 text-[10px] uppercase opacity-90">
            <Power size={11} /> {partner.is_open ? "Fechar" : "Abrir"}
          </span>
        </button>

        {/* Pause / Resume operation */}
        {partner.store_status !== "blocked" && (
          <button
            onClick={togglePause}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-[11px] font-bold active:scale-[.98] transition-all ${
              partner.store_status === "paused"
                ? "bg-white text-yellow-600 shadow-md"
                : "bg-white/15 hover:bg-white/25 text-white"
            }`}
          >
            {partner.store_status === "paused" ? (<><Play size={12} /> Retomar operação</>) : (<><Pause size={12} /> Pausar operação</>)}
          </button>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <HeroStat icon={<Bell size={12} />} label="Novos" value={newOrdersCount} />
          <HeroStat icon={<Clock size={12} />} label="Em curso" value={deliveries.filter(d => d.status === "aceita" || d.status === "em_andamento").length} />
          <HeroStat icon={<CheckCircle2 size={12} />} label="Hoje" value={deliveries.filter(d => {
            const t = new Date(d.created_at); const now = new Date();
            return t.getDate() === now.getDate() && t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
          }).length} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {newOrdersCount > 0 && (
          <button
            onClick={() => setTab("list")}
            className="w-full bg-blue-500/10 border border-blue-500/40 rounded-2xl p-3 flex items-center gap-3 active:scale-[.98] transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bell size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-black text-blue-700">
                {newOrdersCount} {newOrdersCount === 1 ? "novo pedido pago" : "novos pedidos pagos"}
              </p>
              <p className="text-[11px] text-blue-600">Toque para visualizar e iniciar o preparo</p>
            </div>
          </button>
        )}

        {partner.uses_app_courier && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-3 py-2 text-[11px] text-foreground flex items-start gap-2">
            <DollarSign size={14} className="text-yellow-600 shrink-0 mt-0.5" />
            <span>Ao usar entregadores do app, é cobrada <b>taxa de 8%</b> sobre o valor do pedido.</span>
          </div>
        )}

        {/* Tab pill bar — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  active
                    ? "bg-foreground text-background shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {t.icon}
                {t.label}
                {t.badge && t.badge > 0 ? (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-black rounded-full bg-red-500 text-white px-1">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
          <button
            onClick={() => loadDeliveries(pin)}
            className="shrink-0 p-2 rounded-full bg-muted active:scale-95"
            title="Atualizar"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

      {tab === "dash" && <PartnerDashboardTab deliveries={deliveries} />}

      {tab === "products" && <PartnerProductsTab pin={pin} />}

      {tab === "chats" && <PartnerChatsTab pin={pin} partnerId={partner.id} />}

      {tab === "store" && (
        <PartnerStoreTab
          pin={pin}
          onChanged={(s) => setPartner((prev) => prev ? { ...prev, business_name: s.business_name, address: s.address, whatsapp: s.whatsapp, is_open: s.is_open } : prev)}
        />
      )}

      {tab === "new" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <Field label="Pedido / produto" value={orderDesc} onChange={setOrderDesc} />
          <Field label="Endereço de entrega" value={address} onChange={setAddress} />
          <Field label="Observações (opcional)" value={notes} onChange={setNotes} />
          <NumField
            label={partner.uses_app_courier ? "Valor do pedido (R$) *" : "Valor do pedido (R$)"}
            value={orderValue}
            onChange={setOrderValue}
          />
          <NumField label="Valor da entrega (R$)" value={fee} onChange={setFee} />

          {partner.uses_app_courier && orderValue > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">Resumo</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Valor do pedido</span><b className="text-foreground">R$ {orderValue.toFixed(2)}</b>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa do app (8%)</span><b className="text-primary">R$ {(orderValue * 0.08).toFixed(2)}</b>
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-1">
                Apenas referência. A cobrança será feita posteriormente pelo app.
              </p>
            </div>
          )}

          <button
            disabled={loading}
            onClick={submit}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
          >
            <Truck size={14} className="inline mr-1" /> Enviar pedido
          </button>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-2">
          <div className="flex gap-1.5 mb-1">
            {([
              { id: "all", label: "Todos" },
              { id: "delivery", label: "🛵 Entrega" },
              { id: "pickup", label: "🛍 Retirada" },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderFilter(f.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                  orderFilter === f.id
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {deliveries.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <div className="text-5xl">📭</div>
              <p className="text-sm font-bold text-foreground">Nenhum pedido ainda</p>
              <p className="text-xs text-muted-foreground">Os pedidos aparecerão aqui em tempo real.</p>
            </div>
          )}
          {deliveries
            .filter((d) => {
              if (orderFilter === "all") return true;
              const ft = d.fulfillment_type === "pickup" ? "pickup" : "delivery";
              return ft === orderFilter;
            })
            .map((d) => {
            const s = STATUS_LABEL[d.status] || STATUS_LABEL.disponivel;
            const isPaidNew = d.status === "disponivel";
            const isPickup = d.fulfillment_type === "pickup";
            return (
              <div
                key={d.id}
                className={`bg-card rounded-2xl border p-3 space-y-1 transition-all ${
                  isPaidNew
                    ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10 animate-pulse-once"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground flex-1">{d.order_description}</p>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${s.color}`}>{s.label}</span>
                    {isPickup && (
                      <span className="text-[10px] font-black bg-orange-500/15 text-orange-700 border border-orange-500/30 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        🛍 Retirada
                      </span>
                    )}
                  </div>
                </div>
                {!isPickup && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <MapPin size={10} className="mt-0.5 shrink-0" /> {d.delivery_address}
                  </p>
                )}
                {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
                <p className="text-xs text-foreground">
                  {isPickup ? "Sem taxa de entrega" : <>Taxa: <b>R$ {Number(d.fee).toFixed(2)}</b></>}
                </p>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>

                {!isPickup && d.prep_status && d.prep_status !== "ready" && d.status === "disponivel" && (
                  <div className="mt-2 rounded-xl bg-yellow-500/10 border border-yellow-500/40 p-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-yellow-700">
                      {d.prep_status === "pending" ? "⏳ Aguardando preparo" : "👨‍🍳 Em preparo"}
                    </span>
                    <button
                      onClick={() => callCourier(d.id)}
                      className="bg-primary text-primary-foreground text-[11px] font-black px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      🚚 Chamar entregador
                    </button>
                  </div>
                )}

                {/* Avançar status (apenas pedidos sem entregador app vinculado) */}
                {!d.courier_id && d.status !== "concluida" && d.status !== "cancelada" && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2">
                    {d.status === "disponivel" && (
                      <button
                        onClick={() => advanceStatus(d.id, "aceita")}
                        className="col-span-2 bg-yellow-500/15 border border-yellow-500/40 text-yellow-700 font-bold text-xs py-2 rounded-xl active:scale-95 flex items-center justify-center gap-1"
                      >
                        <ChefHat size={12} /> Marcar em preparo
                      </button>
                    )}
                    {d.status === "aceita" && (
                      <button
                        onClick={() => advanceStatus(d.id, "em_andamento")}
                        className="col-span-2 bg-orange-500/15 border border-orange-500/40 text-orange-700 font-bold text-xs py-2 rounded-xl active:scale-95 flex items-center justify-center gap-1"
                      >
                        {isPickup ? <><Package size={12} /> Pronto para retirada</> : <><Bike size={12} /> Saiu para entrega</>}
                      </button>
                    )}
                    {d.status === "em_andamento" && (
                      <button
                        onClick={() => advanceStatus(d.id, "concluida")}
                        className="col-span-2 bg-green-500/15 border border-green-500/40 text-green-700 font-bold text-xs py-2 rounded-xl active:scale-95 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={12} /> {isPickup ? "Marcar como retirado" : "Marcar como entregue"}
                      </button>
                    )}
                  </div>
                )}

                {d.status === "concluida" && d.courier_id && (
                  ratedIds.has(d.id) ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                      <Star size={12} className="fill-green-600" /> Avaliado
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRateModal(d); setStars(5); setComment(""); }}
                      className="w-full mt-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 font-bold text-xs py-2 rounded-xl active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Star size={12} /> Avaliar entregador
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {rateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setRateModal(null)}>
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Avaliar entregador</h3>
              <button onClick={() => setRateModal(null)} className="p-1 rounded-lg bg-muted">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{rateModal.order_description}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} className="active:scale-90 transition-transform">
                  <Star size={36} className={n <= stars ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentário (opcional)"
              maxLength={300}
              rows={3}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm resize-none"
            />
            <button
              onClick={submitRating}
              className="w-full bg-primary text-primary-foreground font-black py-3 rounded-xl active:scale-95"
            >
              Enviar avaliação
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
      />
    </div>
  );
}

function StatBox({ label, count, color }: { label: string; count: number; color: "blue" | "orange" | "green" | "primary" }) {
  const colorMap = {
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-600",
    green: "bg-green-500/10 border-green-500/30 text-green-600",
    primary: "bg-primary/10 border-primary/30 text-primary",
  };
  return (
    <div className={`border rounded-xl p-2 text-center ${colorMap[color]}`}>
      <p className="text-lg font-black text-foreground">{count}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}

function HeroStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wide opacity-90">
        {icon} {label}
      </div>
      <p className="text-xl font-black mt-0.5">{value}</p>
    </div>
  );
}