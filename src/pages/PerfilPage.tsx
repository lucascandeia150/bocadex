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
        <h1 className="text-xl font-black text-foreground">Sua conta Bocadex</h1>
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
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
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
        {tab === "cupons" && <ComingSoon icon={Ticket} title="Cupons em breve" desc="Em breve você poderá inserir códigos de desconto e ver promoções aqui." />}
        {tab === "pagamentos" && <ComingSoon icon={CreditCard} title="Métodos de pagamento" desc="Em breve você poderá salvar PIX e cartões para pagar mais rápido. Por enquanto, o pagamento é feito direto no checkout." />}
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

  const items = [
    { icon: Bell, label: "Notificações", desc: "Status dos pedidos em tempo real", soon: true },
    { icon: Shield, label: "Privacidade", desc: "Termos e política", soon: true },
    { icon: MessageCircle, label: "Suporte", desc: "Fale com a gente", onClick: () => navigate("/contato") },
    { icon: Info, label: "Sobre o app", desc: "Bocadex", onClick: () => navigate("/sobre") },
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
                {it.soon && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary uppercase">
                    Em breve
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

/* ============================================================ */
/* Coming soon genérico                                         */
/* ============================================================ */
function ComingSoon({ icon: Icon, title, desc }: { icon: typeof Sparkles; title: string; desc: string }) {
  return (
    <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-border bg-card animate-slide-up">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3">
        <Icon size={26} className="text-primary" />
      </div>
      <p className="text-base font-black text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px] mx-auto">{desc}</p>
      <span className="inline-block mt-3 text-[10px] font-black px-2.5 py-1 rounded-full bg-secondary/20 text-secondary uppercase">
        Em breve
      </span>
    </div>
  );
}