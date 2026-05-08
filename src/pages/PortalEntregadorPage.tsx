import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, RefreshCw, MapPin, ArrowLeft, LogOut, MessageCircle, Check, X, Package, Clock, History, Star, Mail, Lock, Wifi, WifiOff } from "lucide-react";
import { CourierDashboard } from "@/components/portal/CourierDashboard";

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
}

interface Delivery {
  id: string;
  partner_id: string | null;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  status: string;
  courier_id: string | null;
  partner_whatsapp: string | null;
  created_at: string;
  delivery_code: string | null;
}

const PIN_KEY = "escolheai_courier_pin";
const SEEN_KEY = "escolheai_courier_seen_ids";

export default function PortalEntregadorPage() {
  const [pin, setPin] = useState("");
  const [authMode, setAuthMode] = useState<"email" | "pin">("email");
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [emailLoading, setEmailLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [courier, setCourier] = useState<Courier | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [tab, setTab] = useState<"active" | "history">("active");
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<{ avg: number; total: number }>({ avg: 0, total: 0 });
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [finishLoading, setFinishLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  useEffect(() => {
    // Tenta login por sessão Auth primeiro
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await loadFromAuth();
        return;
      }
      const saved = localStorage.getItem(PIN_KEY);
      if (saved) { setPin(saved); tryLogin(saved, true); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryLogin = async (code: string, silent = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("courier_login", { _pin: code });
    setLoading(false);
    if (error || !data || data.length === 0) {
      if (!silent) toast.error("PIN inválido");
      localStorage.removeItem(PIN_KEY);
      setCourier(null);
      return;
    }
    setCourier(data[0] as Courier);
    localStorage.setItem(PIN_KEY, code);
    loadDeliveries(code, true);
  };

  const loadFromAuth = async () => {
    setEmailLoading(true);
    const { data, error } = await supabase.rpc("courier_login_self");
    if (error) { toast.error(error.message); setEmailLoading(false); return; }
    if (!data || data.length === 0) {
      // Verifica se há cadastro pendente/recusado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: app } = await supabase
          .from("courier_applications").select("status").eq("user_id", user.id).maybeSingle();
        setPendingStatus(app?.status || "sem_cadastro");
      }
      setEmailLoading(false);
      return;
    }
    const c = data[0];
    setCourier({ id: c.id, name: c.name, phone: c.phone, vehicle: c.vehicle });
    setPin(c.access_pin);
    localStorage.setItem(PIN_KEY, c.access_pin);
    setPendingStatus(null);
    setEmailLoading(false);
    loadDeliveries(c.access_pin, true);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email || !emailForm.password) { toast.error("Preencha email e senha"); return; }
    setEmailLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailForm.email.trim(), password: emailForm.password,
    });
    if (error) { toast.error(error.message); setEmailLoading(false); return; }
    await loadFromAuth();
  };

  const loadDeliveries = async (code: string, markSeen = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("courier_list_deliveries", { _pin: code });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar pedidos"); return; }
    const list = (data as Delivery[]) || [];
    setDeliveries(list);

    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    const availableIds = list.filter((d) => d.status === "disponivel").map((d) => d.id);
    const newOnes = availableIds.filter((id) => !seen.includes(id));
    setNewCount(newOnes.length);
    if (markSeen) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(availableIds));
      setNewCount(0);
    }
  };

  const refresh = () => loadDeliveries(pin, true);

  const loadHistory = async (courierId: string) => {
    const { data } = await supabase
      .from("deliveries")
      .select("id, partner_name, order_description, delivery_address, fee, status, created_at")
      .eq("courier_id", courierId)
      .eq("status", "concluida")
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory(data || []);

    const { data: s } = await supabase.rpc("courier_rating_stats", { _courier_id: courierId });
    if (s && s.length > 0) {
      setStats({ avg: Number(s[0].avg_stars) || 0, total: Number(s[0].total_ratings) || 0 });
    }
  };

  // Realtime: novos pedidos disponíveis e mudanças
  useEffect(() => {
    if (!courier || !pin) return;
    // Heartbeat a cada 60s enquanto o portal estiver aberto e online
    const beat = setInterval(() => {
      if (isOnline) supabase.rpc("courier_heartbeat", { _pin: pin });
    }, 60_000);
    const channel = supabase
      .channel("courier-deliveries")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "deliveries" }, (payload) => {
        const d: any = payload.new;
        if (d.status === "disponivel") {
          toast.success("🚀 Nova entrega disponível!");
          loadDeliveries(pin, false);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "deliveries" }, (payload: any) => {
        const oldStatus = payload.old?.status;
        const newStatus = payload.new?.status;
        const mine = payload.new?.courier_id === courier.id;
        if (mine && oldStatus !== newStatus) {
          if (newStatus === "concluida") toast.success("🎉 Entrega finalizada!");
          else if (newStatus === "cancelada") toast.error("❌ Pedido cancelado");
        }
        loadDeliveries(pin, false);
      })
      .subscribe();
    loadHistory(courier.id);
    return () => { supabase.removeChannel(channel); clearInterval(beat); };
  }, [courier, pin, isOnline]);

  const toggleOnline = async () => {
    if (!pin) return;
    setTogglingOnline(true);
    const next = !isOnline;
    const { error } = await supabase.rpc("courier_set_online", { _pin: pin, _online: next });
    setTogglingOnline(false);
    if (error) { toast.error(error.message || "Erro ao mudar status"); return; }
    setIsOnline(next);
    toast.success(next ? "Você está online 🟢" : "Você ficou offline ⚪");
  };

  const logout = async () => {
    if (pin) { try { await supabase.rpc("courier_set_online", { _pin: pin, _online: false }); } catch {} }
    await supabase.auth.signOut();
    localStorage.removeItem(PIN_KEY);
    setCourier(null);
    setPin("");
    setDeliveries([]);
    setPendingStatus(null);
    setIsOnline(false);
  };

  const action = async (id: string, act: "accept" | "release") => {
    const { error } = await supabase.rpc("courier_update_delivery", {
      _pin: pin,
      _delivery_id: id,
      _action: act,
    });
    if (error) { toast.error(error.message || "Erro"); return; }
    toast.success(act === "accept" ? "Aceito ✅" : "Liberado");
    loadDeliveries(pin, true);
  };

  const confirmFinish = async () => {
    if (!finishingId) return;
    if (codeInput.length !== 4) {
      toast.error("Digite o código de 4 dígitos");
      return;
    }
    setFinishLoading(true);
    const { error } = await supabase.rpc("courier_update_delivery", {
      _pin: pin,
      _delivery_id: finishingId,
      _action: "finish",
      _code: codeInput,
    });
    setFinishLoading(false);
    if (error) {
      toast.error(error.message?.includes("Código") ? "Código inválido" : (error.message || "Erro"));
      return;
    }
    toast.success("Entrega confirmada ✅");
    setFinishingId(null);
    setCodeInput("");
    loadDeliveries(pin, true);
  };

  if (!courier) {
    if (pendingStatus && pendingStatus !== "aprovado") {
      const msg = pendingStatus === "recusado"
        ? "Seu cadastro não foi aprovado."
        : pendingStatus === "sem_cadastro"
        ? "Você ainda não enviou seu cadastro."
        : "Seu cadastro está aguardando aprovação do admin.";
      return (
        <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up text-center">
          <span className="text-5xl block">⏳</span>
          <h1 className="text-lg font-black text-foreground">{pendingStatus === "recusado" ? "Cadastro recusado" : "Aguardando aprovação"}</h1>
          <p className="text-sm text-muted-foreground">{msg}</p>
          <a href="/seja-entregador" className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            {pendingStatus === "sem_cadastro" ? "Fazer cadastro" : "Ver cadastro"}
          </a>
          <div><button onClick={logout} className="text-xs text-destructive underline">Sair</button></div>
        </div>
      );
    }
    return (
      <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
        <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </a>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <Truck className="mx-auto text-primary" size={40} />
          <h1 className="text-lg font-black text-foreground text-center">Portal do Entregador</h1>

          <div className="flex gap-2">
            <button onClick={() => setAuthMode("email")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${authMode === "email" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              Email e senha
            </button>
            <button onClick={() => setAuthMode("pin")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${authMode === "pin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              PIN
            </button>
          </div>

          {authMode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input type="email" value={emailForm.email}
                  onChange={(e) => setEmailForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="seu@email.com" autoComplete="email"
                  className="w-full bg-muted rounded-xl pl-9 pr-3 py-3 text-sm text-foreground" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input type="password" value={emailForm.password}
                  onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Senha" autoComplete="current-password"
                  className="w-full bg-muted rounded-xl pl-9 pr-3 py-3 text-sm text-foreground" />
              </div>
              <button type="submit" disabled={emailLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50">
                {emailLoading ? "Entrando..." : "Entrar"}
              </button>
              <a href="/seja-entregador" className="block text-center text-xs text-primary font-bold underline">
                Ainda não tenho conta — cadastrar
              </a>
            </form>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-xs text-muted-foreground">Digite seu PIN de 6 dígitos.</p>
              <input type="text" inputMode="numeric" maxLength={6} value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-2xl font-black tracking-widest bg-muted rounded-xl px-3 py-3" />
              <button disabled={loading || pin.length !== 6} onClick={() => tryLogin(pin)}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const available = deliveries.filter((d) => d.status === "disponivel");
  const mine = deliveries.filter((d) => d.courier_id === courier.id && d.status !== "concluida");

  return (
    <div className="p-4 max-w-md mx-auto space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Portal do entregador</p>
          <h1 className="text-base font-black text-foreground">{courier.name}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleOnline}
            disabled={togglingOnline}
            className={`min-h-[40px] px-3 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition ${isOnline ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}
            aria-label={isOnline ? "Ficar offline" : "Ficar online"}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? "Online" : "Offline"}
          </button>
          <button onClick={refresh} className="relative p-2 rounded-xl bg-muted">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {newCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {newCount}
              </span>
            )}
          </button>
          <button onClick={logout} className="p-2 rounded-xl bg-destructive/10 text-destructive">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
        💡 O pagamento da entrega é combinado diretamente com a loja.
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${tab === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Package size={12} /> Ativos
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${tab === "history" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <History size={12} /> Histórico
        </button>
      </div>

      {tab === "history" && (
        <div className="space-y-2">
          <div className="bg-card rounded-2xl border border-border p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Sua avaliação</p>
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-500 text-yellow-500" />
                <p className="text-base font-black text-foreground">{stats.avg.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">({stats.total})</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Entregas concluídas</p>
              <p className="text-base font-black text-foreground">{history.length}</p>
            </div>
          </div>
          {history.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhuma entrega concluída ainda 📭</p>
          )}
          {history.map((h) => (
            <div key={h.id} className="bg-card rounded-2xl border border-border p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground truncate">{h.partner_name}</p>
                  <p className="text-xs text-muted-foreground">{h.order_description}</p>
                </div>
                <span className="text-sm font-black text-primary whitespace-nowrap">R$ {Number(h.fee).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <MapPin size={10} className="mt-0.5 shrink-0" /> {h.delivery_address}
              </p>
              <p className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "active" && <>
      <CourierDashboard history={history as any} ratingAvg={stats.avg} ratingCount={stats.total} />
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-orange-600" />
            <p className="text-[10px] font-bold text-orange-600 uppercase">Disponíveis</p>
          </div>
          <p className="text-2xl font-black text-foreground mt-1">{deliveries.filter((d) => d.status === "disponivel").length}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <p className="text-[10px] font-bold text-blue-600 uppercase">Em andamento</p>
          </div>
          <p className="text-2xl font-black text-foreground mt-1">{deliveries.filter((d) => d.courier_id === courier.id && d.status !== "concluida").length}</p>
        </div>
      </div>

      {mine.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-foreground mb-2">🚚 Em andamento ({mine.length})</h2>
          <div className="space-y-2">
            {mine.map((d) => (
              <DeliveryCard
                key={d.id}
                d={d}
                onFinish={() => { setFinishingId(d.id); setCodeInput(""); }}
                onRelease={() => action(d.id, "release")}
                accepted
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-black text-foreground mb-2">📦 Pedidos disponíveis ({available.length})</h2>
        <div className="space-y-2">
          {available.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhum pedido disponível 🕐</p>
          )}
          {available.map((d) => (
            <DeliveryCard
              key={d.id}
              d={d}
              onAccept={() => action(d.id, "accept")}
            />
          ))}
        </div>
      </div>
      </>}

      {finishingId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => !finishLoading && setFinishingId(null)}>
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-sm space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <div className="text-3xl">🔐</div>
              <h3 className="text-base font-black text-foreground">Confirmar entrega</h3>
              <p className="text-xs text-muted-foreground">Peça ao cliente o código de 4 dígitos.</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
              placeholder="0000"
              autoFocus
              className="w-full text-center text-3xl font-black tracking-[0.5em] bg-muted rounded-xl px-3 py-3 text-foreground"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFinishingId(null)}
                disabled={finishLoading}
                className="flex-1 bg-muted text-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinish}
                disabled={finishLoading || codeInput.length !== 4}
                className="flex-1 bg-primary text-primary-foreground font-black py-3 rounded-xl active:scale-95 disabled:opacity-50"
              >
                {finishLoading ? "Validando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({
  d,
  onAccept,
  onFinish,
  onRelease,
  accepted,
}: {
  d: Delivery;
  onAccept?: () => void;
  onFinish?: () => void;
  onRelease?: () => void;
  accepted?: boolean;
}) {
  const wa = d.partner_whatsapp?.replace(/\D/g, "");
  const borderClass = accepted
    ? "border-blue-500/40 bg-blue-500/5"
    : "border-orange-500/40 bg-orange-500/5";
  return (
    <div className={`rounded-2xl border-2 p-3 space-y-2 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground truncate">{d.partner_name}</p>
          <p className="text-xs text-muted-foreground">{d.order_description}</p>
        </div>
        <span className="text-base font-black text-primary whitespace-nowrap bg-primary/10 px-2 py-1 rounded-lg">R$ {Number(d.fee).toFixed(2)}</span>
      </div>
      <div className="bg-card border border-border rounded-xl p-2 flex items-start gap-2">
        <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-xs font-bold text-foreground leading-snug">{d.delivery_address}</p>
      </div>
      {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
      {accepted && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.delivery_address)}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white font-black text-sm py-3 rounded-xl active:scale-95 text-center shadow-lg shadow-blue-600/20 inline-flex items-center justify-center gap-1"
          >
            <MapPin size={14} /> Google Maps
          </a>
          <a
            href={`https://waze.com/ul?q=${encodeURIComponent(d.delivery_address)}&navigate=yes`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[hsl(195,100%,45%)] text-white font-black text-sm py-3 rounded-xl active:scale-95 text-center shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-1"
          >
            <MapPin size={14} /> Waze
          </a>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {!accepted && onAccept && (
          <button onClick={onAccept} className="flex-1 bg-primary text-primary-foreground font-black text-sm py-3 rounded-xl active:scale-95 shadow-lg shadow-primary/20">
            <Check size={16} className="inline mr-1" /> Aceitar
          </button>
        )}
        {accepted && wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent("Olá! Sou o entregador do pedido " + d.order_description)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-500 text-white font-black text-sm py-3 rounded-xl active:scale-95 text-center shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={16} className="inline mr-1" /> Falar com a loja
          </a>
        )}
        {accepted && onFinish && (
          <button onClick={onFinish} className="flex-1 bg-primary text-primary-foreground font-black text-sm py-3 rounded-xl active:scale-95 shadow-lg shadow-primary/20">
            <Check size={16} className="inline mr-1" /> Finalizar
          </button>
        )}
        {accepted && onRelease && (
          <button onClick={onRelease} className="px-4 bg-destructive/10 text-destructive font-black text-sm py-3 rounded-xl active:scale-95">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}