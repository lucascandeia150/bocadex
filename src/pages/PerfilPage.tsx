import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Package, MapPin, Heart, Ticket, CreditCard, Settings,
  LogIn, LogOut, Save, CheckCircle2, Plus, Trash2, Star, ChevronRight,
  Bell, Shield, Info, MessageCircle, Clock, Sparkles, ChefHat, Bike,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { registerPush, isPushSupported } from "@/lib/push";

type TabKey = "dados" | "pedidos" | "enderecos" | "favoritos" | "cupons" | "pagamentos" | "config";

const TABS: { key: TabKey; label: string; icon: typeof User; emoji: string }[] = [
  { key: "dados", label: "Dados", icon: User, emoji: "👤" },
  { key: "pedidos", label: "Pedidos", icon: Package, emoji: "📦" },
  { key: "enderecos", label: "Endereços", icon: MapPin, emoji: "📍" },
  { key: "favoritos", label: "Favoritos", icon: Heart, emoji: "⭐" },
  { key: "cupons", label: "Cupons", icon: Ticket, emoji: "🎟️" },
  { key: "pagamentos", label: "Pagamento", icon: CreditCard, emoji: "💳" },
  { key: "config", label: "Config", icon: Settings, emoji: "⚙️" },
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [params, setParams] = useSearchParams();
  const initial = (params.get("tab") as TabKey) || "dados";
  const [tab, setTab] = useState<TabKey>(TABS.some((t) => t.key === initial) ? initial : "dados");

  useEffect(() => {
    setParams(tab === "dados" ? {} : { tab }, { replace: true });
  }, [tab, setParams]);

  const displayName = (profile?.name || "").trim();
  const initialLetter = (displayName[0] ?? user?.email?.[0] ?? "👤").toUpperCase();

  // Estado deslogado
  if (!loading && !user) {
    return (
      <div className="px-4 pt-12 pb-32 max-w-sm mx-auto text-center animate-slide-up">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl mb-3 shadow-lg">
          👤
        </div>
        <h1 className="text-xl font-black text-foreground">Sua conta Bocadex Delivery's</h1>
        <p className="text-xs text-muted-foreground mt-1 mb-5">
          Entre pra pedir, acompanhar status em tempo real e ver histórico completo
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow"
        >
          <LogIn size={16} /> Entrar
        </button>
        <button
          onClick={() => navigate("/auth?mode=signup")}
          className="w-full mt-2 bg-card border-2 border-border text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-all text-sm"
        >
          Criar conta
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header com avatar */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-6 pb-5">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
            {initialLetter}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-foreground truncate">
              {displayName || "Olá!"}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs scrolláveis horizontal */}
      <div className="sticky top-14 z-30 bg-background no-blur border-b border-border ">
        <div className="max-w-sm mx-auto overflow-x-auto scrollbar-none">
          <div className="flex gap-1 px-3 py-2 min-w-max">
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-sm mx-auto px-4 pt-4">
        {tab === "dados" && <DadosTab onChanged={refreshProfile} />}
        {tab === "pedidos" && <PedidosTab />}
        {tab === "enderecos" && <EnderecosTab />}
        {tab === "favoritos" && <FavoritosTab />}
        {tab === "cupons" && <CuponsTab />}
        {tab === "pagamentos" && <PagamentoTab />}
        {tab === "config" && <ConfigTab onSignOut={signOut} />}
      </div>
    </div>
  );
}

/* ============================================================ */
/* Tab: Dados pessoais                                          */
/* ============================================================ */
function DadosTab({ onChanged }: { onChanged: () => Promise<void> }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => { setSaved(false); }, [name, phone]);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Informe seu nome"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name: name.trim(), phone: phone.trim(), email: user.email });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar"); return; }
    await onChanged();
    setSaved(true);
    toast.success("Perfil salvo!");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-slide-up">
      <div className="flex items-center gap-2">
        <User size={16} className="text-primary" />
        <p className="text-sm font-black text-foreground">Seus dados</p>
      </div>
      <Field label="Nome">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João da Silva"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
        />
      </Field>
      <Field label="Telefone">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(33) 9..."
          inputMode="tel"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
        />
      </Field>
      <Field label="E-mail">
        <input
          value={user?.email ?? ""}
          disabled
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground"
        />
      </Field>
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow disabled:opacity-60"
      >
        {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
        {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar perfil"}
      </button>
    </div>
  );
}

/* ============================================================ */
/* Tab: Cupons                                                  */
/* ============================================================ */
function CuponsTab() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Array<{ id: string; code: string; description: string; type: string; value: number; min_order: number; expires_at: string | null }>>([]);
  const [usage, setUsage] = useState<Array<{ id: string; coupon_id: string; discount_amount: number; created_at: string }>>([]);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, usageData] = await Promise.all([
      supabase.from("coupons").select("id, code, description, type, value, min_order, expires_at").eq("active", true).order("created_at", { ascending: false }).limit(20),
      user ? supabase.from("coupon_usage").select("id, coupon_id, discount_amount, created_at").eq("user_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setCoupons(c || []);
    setUsage((usageData.data as typeof usage) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const validate = async () => {
    if (!code.trim()) return;
    setValidating(true);
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: code.trim(),
      _order_value: 100,
      _partner_id: null,
    });
    setValidating(false);
    const row = (data as Array<{ ok: boolean; message: string; code: string }> | null)?.[0];
    if (error || !row) { toast.error("Erro ao validar cupom"); return; }
    if (!row.ok) { toast.error(row.message); return; }
    toast.success(`Cupom ${row.code} válido! Use no carrinho para aplicar o desconto.`);
    setCode("");
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-black text-foreground uppercase tracking-wide mb-2">Validar cupom</p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DIGITE O CÓDIGO"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-bold tracking-wider text-foreground"
          />
          <button
            onClick={validate}
            disabled={validating || !code.trim()}
            className="bg-primary text-primary-foreground font-black px-4 rounded-xl text-sm active:scale-95 disabled:opacity-60"
          >
            {validating ? "..." : "Validar"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          O desconto é aplicado automaticamente no carrinho ao usar um cupom válido.
        </p>
      </div>

      <div>
        <p className="text-xs font-black text-foreground uppercase tracking-wide mb-2 px-1">Cupons disponíveis</p>
        {loading ? (
          <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
            <Ticket size={26} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-bold text-foreground">Você ainda não possui cupons ativos</p>
            <p className="text-[11px] text-muted-foreground mt-1">Acompanhe nossas redes para receber promoções!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shrink-0">
                  {c.type === "percent" ? `${c.value}%` : `R$${Number(c.value).toFixed(0)}`}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-foreground tracking-wider text-sm">{c.code}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>
                  {c.min_order > 0 && (
                    <p className="text-[10px] text-muted-foreground">Mínimo R$ {Number(c.min_order).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {usage.length > 0 && (
        <div>
          <p className="text-xs font-black text-foreground uppercase tracking-wide mb-2 px-1 mt-4">Histórico</p>
          <div className="space-y-2">
            {usage.map((u) => (
              <div key={u.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                <p className="text-sm font-black text-primary">- R$ {Number(u.discount_amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Tab: Pagamento                                               */
/* ============================================================ */
function PagamentoTab() {
  return (
    <div className="space-y-3 animate-slide-up">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-secondary/5 p-5">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
          <CreditCard size={22} />
        </div>
        <h3 className="text-base font-black text-foreground">Pagamento seguro</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Seus pedidos são processados pelo <strong className="text-foreground">Mercado Pago</strong>,
          plataforma certificada e usada por milhões de brasileiros.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-sm font-black text-foreground">PIX</p>
          <p className="text-[10px] text-muted-foreground">Aprovação instantânea</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-2xl mb-1">💳</div>
          <p className="text-sm font-black text-foreground">Cartão</p>
          <p className="text-[10px] text-muted-foreground">Crédito ou débito</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-black text-foreground mb-2">Como funciona</p>
        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-black">1.</span> Adicione produtos ao carrinho</li>
          <li className="flex gap-2"><span className="text-primary font-black">2.</span> Escolha PIX ou cartão no checkout</li>
          <li className="flex gap-2"><span className="text-primary font-black">3.</span> Acompanhe o pedido em tempo real</li>
        </ul>
      </div>

      <p className="text-[10px] text-center text-muted-foreground px-4">
        🔒 Não armazenamos dados de cartão. Tudo é processado de forma criptografada pelo Mercado Pago.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{label}</label>
      {children}
    </div>
  );
}

/* ============================================================ */
/* Tab: Pedidos                                                 */
/* ============================================================ */
const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string; bucket: "andamento" | "concluido" | "cancelado" }> = {
  disponivel:   { label: "Aguardando entregador", icon: Clock,        color: "text-muted-foreground", bucket: "andamento" },
  pending:      { label: "Aguardando",            icon: Clock,        color: "text-muted-foreground", bucket: "andamento" },
  preparing:    { label: "Em preparo",            icon: ChefHat,      color: "text-secondary",        bucket: "andamento" },
  aceita:       { label: "Aceito",                icon: ChefHat,      color: "text-secondary",        bucket: "andamento" },
  em_andamento: { label: "Saiu para entrega",     icon: Bike,         color: "text-primary",          bucket: "andamento" },
  concluida:    { label: "Concluído",             icon: CheckCircle2, color: "text-[hsl(142,70%,45%)]", bucket: "concluido" },
  completed:    { label: "Concluído",             icon: CheckCircle2, color: "text-[hsl(142,70%,45%)]", bucket: "concluido" },
  cancelada:    { label: "Cancelado",             icon: Trash2,       color: "text-destructive",      bucket: "cancelado" },
  cancelled:    { label: "Cancelado",             icon: Trash2,       color: "text-destructive",      bucket: "cancelado" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface OrderRow {
  id: string;
  partner_name: string;
  order_description: string;
  order_value: number;
  status: string;
  created_at: string;
  delivery_address: string;
  delivery_code: string | null;
}

function PedidosTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<"todos" | "andamento" | "concluido" | "cancelado">("todos");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.rpc("customer_list_orders");
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-orders-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "deliveries", filter: `user_id=eq.${user.id}` },
        () => { void load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === "todos") return orders;
    return orders.filter((o) => (STATUS_META[o.status]?.bucket ?? "andamento") === filter);
  }, [orders, filter]);

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "andamento", label: "Em andamento" },
    { key: "concluido", label: "Concluídos" },
    { key: "cancelado", label: "Cancelados" },
  ];

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <span className="text-4xl block mb-2">📦</span>
          <p className="font-bold text-sm text-foreground">Nenhum pedido aqui</p>
          <p className="text-[11px] text-muted-foreground mt-1">Seus pedidos aparecem em tempo real</p>
        </div>
      ) : (
        filtered.map((o) => {
          const meta = STATUS_META[o.status] ?? STATUS_META.pending;
          const Icon = meta.icon;
          return (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">🏪 {o.partner_name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(o.created_at)}</p>
                </div>
                <span className={`flex items-center gap-1 text-[11px] font-bold ${meta.color} shrink-0`}>
                  <Icon size={12} /> {meta.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 whitespace-pre-line line-clamp-3">
                {o.order_description}
              </p>
              {o.order_value > 0 && (
                <p className="text-xs font-black text-primary mt-2">
                  Total: R${Number(o.order_value).toFixed(2)}
                </p>
              )}
              {o.delivery_code && meta.bucket === "andamento" && (
                <div className="mt-3 rounded-xl bg-primary/10 border-2 border-dashed border-primary/40 p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">🔐 Código de entrega</p>
                  <p className="text-2xl font-black text-primary tracking-[0.4em] mt-1">{o.delivery_code}</p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ============================================================ */
/* Tab: Endereços                                               */
/* ============================================================ */
interface AddressRow {
  id: string;
  label: string;
  address: string;
  reference: string;
  is_default: boolean;
}

function EnderecosTab() {
  const { user } = useAuth();
  const [list, setList] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "Casa", address: "", reference: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_addresses")
      .select("id, label, address, reference, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setList((data as AddressRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const add = async () => {
    if (!user) return;
    if (!form.address.trim()) { toast.error("Informe o endereço"); return; }
    setSaving(true);
    const isFirst = list.length === 0;
    const { error } = await supabase.from("user_addresses").insert({
      user_id: user.id,
      label: form.label.trim() || "Endereço",
      address: form.address.trim(),
      reference: form.reference.trim(),
      is_default: isFirst,
    });
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar"); return; }
    toast.success("Endereço adicionado!");
    setForm({ label: "Casa", address: "", reference: "" });
    setAdding(false);
    await load();
  };

  const setDefault = async (id: string) => {
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Endereço padrão atualizado");
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este endereço?")) return;
    await supabase.from("user_addresses").delete().eq("id", id);
    toast.success("Endereço removido");
    await load();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      {loading ? (
        <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
      ) : list.length === 0 && !adding ? (
        <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border">
          <MapPin className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm font-bold text-foreground">Nenhum endereço salvo</p>
          <p className="text-[11px] text-muted-foreground mt-1">Adicione pra agilizar seus pedidos</p>
        </div>
      ) : (
        list.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" />
                  <p className="text-sm font-bold text-foreground">{a.label}</p>
                  {a.is_default && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{a.address}</p>
                {a.reference && <p className="text-[10px] text-muted-foreground italic mt-0.5">📌 {a.reference}</p>}
              </div>
              <button
                onClick={() => remove(a.id)}
                className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 active:scale-90"
                aria-label="Remover"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {!a.is_default && (
              <button
                onClick={() => setDefault(a.id)}
                className="mt-2 text-[10px] font-bold text-primary active:scale-95"
              >
                Definir como padrão
              </button>
            )}
          </div>
        ))
      )}

      {adding ? (
        <div className="rounded-2xl border-2 border-primary/40 bg-card p-3 space-y-2">
          <Field label="Apelido (Casa, Trabalho...)">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Endereço completo">
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="Rua, número, bairro..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Ponto de referência (opcional)">
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex: portão azul"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-xs active:scale-95 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar endereço"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 bg-card border border-border font-bold py-2.5 rounded-xl text-xs active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 bg-card border-2 border-dashed border-border hover:border-primary/40 text-foreground font-bold py-3 rounded-2xl text-xs active:scale-95"
        >
          <Plus size={14} /> Adicionar endereço
        </button>
      )}
    </div>
  );
}

/* ============================================================ */
/* Tab: Favoritos                                               */
/* ============================================================ */
interface FavRow {
  id: string;
  partner_id: string;
  partner: { id: string; business_name: string; logo_url: string | null; is_open: boolean } | null;
}

function FavoritosTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<FavRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: favs } = await supabase
      .from("user_favorite_partners")
      .select("id, partner_id")
      .eq("user_id", user.id);
    if (!favs || favs.length === 0) {
      setList([]); setLoading(false); return;
    }
    const ids = favs.map((f) => f.partner_id);
    const { data: partners } = await supabase
      .from("partner_applications")
      .select("id, business_name, logo_url, is_open")
      .in("id", ids);
    const map = new Map(partners?.map((p) => [p.id, p]) ?? []);
    setList(favs.map((f) => ({ ...f, partner: (map.get(f.partner_id) as FavRow["partner"]) ?? null })));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("user_favorite_partners").delete().eq("id", id);
    toast.success("Removido dos favoritos");
    await load();
  };

  return (
    <div className="space-y-2 animate-slide-up">
      {loading ? (
        <p className="text-center text-xs text-muted-foreground py-8">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border">
          <Heart className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm font-bold text-foreground">Sem favoritos ainda</p>
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">Toque no ❤️ nas lojas pra salvar</p>
          <button
            onClick={() => navigate("/lojas")}
            className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs active:scale-95"
          >
            Ver lojas
          </button>
        </div>
      ) : (
        list.map((f) => (
          <div key={f.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
            <button
              onClick={() => f.partner && navigate(`/loja/${f.partner.id}`)}
              className="flex-1 flex items-center gap-3 min-w-0 text-left active:scale-[0.98]"
            >
              {f.partner?.logo_url ? (
                <img src={f.partner.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">🏪</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {f.partner?.business_name ?? "Loja"}
                </p>
                <p className="text-[10px] font-bold mt-0.5">
                  {f.partner?.is_open ? (
                    <span className="text-[hsl(142,70%,40%)]">● Aberto</span>
                  ) : (
                    <span className="text-muted-foreground">● Fechado</span>
                  )}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => remove(f.id)}
              className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 active:scale-90"
              aria-label="Remover favorito"
            >
              <Heart size={14} className="fill-current" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

/* ============================================================ */
/* Tab: Config                                                  */
/* ============================================================ */
function ConfigTab({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await onSignOut();
    toast.success("Você saiu da conta");
    navigate("/");
  };

  const handleEnableNotifications = async () => {
    if (!(await isPushSupported())) {
      toast.error("Notificações não suportadas neste dispositivo");
      return;
    }
    const r = await registerPush();
    if (r.ok) toast.success("Notificações ativadas!");
    else if (r.reason === "denied") toast.error("Permissão negada nas configurações do navegador");
    else toast.error("Não foi possível ativar agora");
  };

  const items = [
    { icon: Bell, label: "Notificações", desc: "Receber status dos pedidos em tempo real", onClick: handleEnableNotifications, badge: "Ativar" },
    { icon: Shield, label: "Privacidade", desc: "Termos, política e LGPD", onClick: () => navigate("/privacidade"), badge: "Protegido" },
    { icon: MessageCircle, label: "Suporte", desc: "Fale com a gente", onClick: () => navigate("/contato") },
    { icon: Info, label: "Sobre o app", desc: "Bocadex Delivery's", onClick: () => navigate("/sobre") },
  ];

  return (
    <div className="space-y-2 animate-slide-up">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button
            key={it.label}
            onClick={it.onClick}
            disabled={!it.onClick}
            className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:scale-[0.98] transition-transform hover:border-primary/40 disabled:opacity-60 disabled:active:scale-100"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {it.label}
                {it.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase">
                    {it.badge}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">{it.desc}</p>
            </div>
            {it.onClick && <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
          </button>
        );
      })}

      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-left active:scale-[0.98] transition-transform mt-3"
      >
        <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
          <LogOut size={16} className="text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-destructive">Sair da conta</p>
          <p className="text-[11px] text-muted-foreground">Encerrar sessão neste aparelho</p>
        </div>
      </button>
    </div>
  );
}
