import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Plus, RefreshCw, MapPin, Truck, ArrowLeft, LogOut, Star, X, Package, Settings, Mail, Lock, KeyRound } from "lucide-react";
import PartnerProductsTab from "@/components/portal/PartnerProductsTab";
import PartnerStoreTab from "@/components/portal/PartnerStoreTab";

interface Partner {
  id: string;
  business_name: string;
  address: string;
  whatsapp: string;
  uses_app_courier?: boolean;
  is_open?: boolean;
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
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  disponivel: { label: "Aguardando entregador", color: "bg-blue-500/10 text-blue-600" },
  aceita: { label: "Aceita", color: "bg-yellow-500/10 text-yellow-600" },
  em_andamento: { label: "Em andamento", color: "bg-orange-500/10 text-orange-600" },
  concluida: { label: "Finalizado", color: "bg-green-500/10 text-green-600" },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-600" },
};

const PIN_KEY = "escolheai_partner_pin";

export default function PortalLojaPage() {
  const [pin, setPin] = useState("");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"list" | "new" | "products" | "store">("list");
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
    return (
      <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
        <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </a>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
          <Store className="mx-auto text-primary" size={40} />
          <h1 className="text-lg font-black text-foreground">Portal da Loja</h1>
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Portal da loja</p>
          <h1 className="text-base font-black text-foreground flex items-center gap-2">
            {partner.business_name}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${partner.is_open ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
              {partner.is_open ? "🟢 Aberta" : "🔴 Fechada"}
            </span>
          </h1>
        </div>
        <button onClick={logout} className="p-2 rounded-xl bg-destructive/10 text-destructive">
          <LogOut size={14} />
        </button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
        💡 O pagamento da entrega é combinado diretamente entre loja e entregador.
      </div>

      {partner.uses_app_courier && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-foreground">
          💡 Ao utilizar entregadores do app EscolheAí, será aplicada uma <b>taxa de 8%</b> sobre o valor do pedido.
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="Aguard." count={deliveries.filter(d => d.status === "disponivel").length} color="blue" />
          <StatBox label="Aceitos" count={deliveries.filter(d => d.status === "aceita" || d.status === "em_andamento").length} color="orange" />
          <StatBox label="Final." count={deliveries.filter(d => d.status === "concluida").length} color="green" />
          <StatBox label="Total" count={deliveries.length} color="primary" />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("list")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          📦 Pedidos
        </button>
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Plus size={12} className="inline" /> Novo
        </button>
        <button
          onClick={() => setTab("products")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "products" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Package size={12} className="inline" /> Produtos
        </button>
        <button
          onClick={() => setTab("store")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "store" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Settings size={12} className="inline" /> Loja
        </button>
        <button onClick={() => loadDeliveries(pin)} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {tab === "products" && <PartnerProductsTab pin={pin} />}

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
          {deliveries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhum pedido ainda 📭</p>
          )}
          {deliveries.map((d) => {
            const s = STATUS_LABEL[d.status] || STATUS_LABEL.disponivel;
            return (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground flex-1">{d.order_description}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin size={10} className="mt-0.5 shrink-0" /> {d.delivery_address}
                </p>
                {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
                <p className="text-xs text-foreground">Taxa: <b>R$ {Number(d.fee).toFixed(2)}</b></p>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
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