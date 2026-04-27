import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Store, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Power, Star, DoorOpen, DoorClosed,
  Copy, CheckCircle2, XCircle, Clock, Settings2,
} from "lucide-react";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";

interface Partner {
  id: string;
  business_name: string;
  business_type: string;
  owner_name: string | null;
  whatsapp: string;
  address: string;
  status: string;
  is_active: boolean;
  is_open: boolean;
  is_featured: boolean;
  uses_app_courier: boolean;
  access_pin: string | null;
  logo_url: string | null;
  created_at: string;
}

const STATUSES = [
  { id: "all", label: "Todos" },
  { id: "approved", label: "Aprovados" },
  { id: "pending", label: "Pendentes" },
  { id: "rejected", label: "Recusados" },
];

const PAGE_SIZE = 20;

export default function AdminStoresPage() {
  const [rows, setRows] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyPartners, setLegacyPartners] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("partner_applications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status !== "all") q = q.eq("status", status);
    if (search.trim()) q = q.or(`business_name.ilike.%${search}%,owner_name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
    const { data, count } = await q;
    setRows((data as Partner[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  const loadLegacy = async () => {
    const { data } = await supabase.from("partner_applications").select("*").order("created_at", { ascending: false });
    setLegacyPartners(data || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status]);
  useEffect(() => { if (showLegacy) loadLegacy(); }, [showLegacy]);

  useEffect(() => {
    const ch = supabase.channel("admin-stores-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, () => {
        load();
        if (showLegacy) loadLegacy();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [page, status, search, showLegacy]);

  const update = async (p: Partner, patch: Partial<Partner>, label: string) => {
    const { error } = await supabase.from("partner_applications").update(patch).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${label} atualizado`);
    await supabase.rpc("log_audit_event", {
      _actor_type: "admin", _actor_id: null, _actor_label: "Admin",
      _action: `partner.${label.toLowerCase()}`, _entity_type: "partner",
      _entity_id: p.id, _description: `${label} alterado em ${p.business_name}`, _metadata: patch as any,
    });
    load();
  };

  const setStatusOf = (p: Partner, newStatus: "approved" | "rejected") =>
    update(p, { status: newStatus, is_active: newStatus === "approved" } as any, newStatus === "approved" ? "Aprovação" : "Recusa");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground">Lojas (Parceiros)</h1>
          <p className="text-sm text-muted-foreground">{total} lojas · página {page + 1} de {totalPages}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLegacy((v) => !v)} className="flex items-center gap-1 text-xs font-bold bg-muted hover:bg-muted/70 px-3 py-2 rounded-lg">
            <Settings2 size={12} /> {showLegacy ? "Ver lista" : "Gestão completa"}
          </button>
          <button onClick={load} className="p-2 rounded-lg bg-muted hover:bg-muted/70" title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showLegacy ? (
        <div className="bg-card border border-border rounded-2xl p-4">
          <AdminPartnersTab partners={legacyPartners} onRefresh={loadLegacy} />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); load(); } }}
                placeholder="Buscar por nome, dono ou WhatsApp... (Enter)"
                className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStatus(s.id); setPage(0); }}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                    status === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                <Store className="mx-auto text-muted-foreground mb-2" size={28} />
                Nenhuma loja encontrada.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((p) => <PartnerRow key={p.id} p={p} onUpdate={update} onSetStatus={setStatusOf} />)}
              </div>
            )}
          </div>

          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function PartnerRow({ p, onUpdate, onSetStatus }: {
  p: Partner;
  onUpdate: (p: Partner, patch: Partial<Partner>, label: string) => void;
  onSetStatus: (p: Partner, s: "approved" | "rejected") => void;
}) {
  const copyPin = () => {
    if (!p.access_pin) return;
    navigator.clipboard.writeText(p.access_pin);
    toast.success("PIN copiado");
  };

  return (
    <div className="p-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
        {p.logo_url ? <img src={p.logo_url} alt="" className="w-full h-full object-cover" /> : p.business_name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-foreground truncate">{p.business_name}</p>
          <StatusBadge status={p.status} />
          {p.is_featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 flex items-center gap-1"><Star size={9} /> Destaque</span>}
          {p.uses_app_courier && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">Entregador app</span>}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{p.business_type} · {p.owner_name || "—"} · {p.whatsapp}</p>
        {p.access_pin && (
          <button onClick={copyPin} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5">
            PIN: <span className="font-black tracking-widest text-primary">{p.access_pin}</span> <Copy size={9} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {p.status === "pending" ? (
          <>
            <button onClick={() => onSetStatus(p, "approved")} className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20" title="Aprovar"><CheckCircle2 size={14} /></button>
            <button onClick={() => onSetStatus(p, "rejected")} className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20" title="Recusar"><XCircle size={14} /></button>
          </>
        ) : (
          <>
            <IconToggle active={p.is_active} onClick={() => onUpdate(p, { is_active: !p.is_active }, "Ativo")} on={<Power size={14} />} off={<Power size={14} />} title={p.is_active ? "Desativar loja" : "Ativar loja"} />
            <IconToggle active={p.is_open} onClick={() => onUpdate(p, { is_open: !p.is_open }, "Aberto")} on={<DoorOpen size={14} />} off={<DoorClosed size={14} />} title={p.is_open ? "Fechar loja" : "Abrir loja"} />
            <IconToggle active={p.is_featured} onClick={() => onUpdate(p, { is_featured: !p.is_featured }, "Destaque")} on={<Star size={14} className="fill-current" />} off={<Star size={14} />} title="Destacar loja" />
          </>
        )}
      </div>
    </div>
  );
}

function IconToggle({ active, onClick, on, off, title }: { active: boolean; onClick: () => void; on: React.ReactNode; off: React.ReactNode; title: string }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition-colors ${active ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
      {active ? on : off}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    approved: { label: "Aprovado", cls: "bg-green-500/10 text-green-600", icon: <CheckCircle2 size={9} /> },
    pending: { label: "Pendente", cls: "bg-yellow-500/10 text-yellow-600", icon: <Clock size={9} /> },
    rejected: { label: "Recusado", cls: "bg-red-500/10 text-red-600", icon: <XCircle size={9} /> },
  };
  const m = map[status] || { label: status, cls: "bg-muted text-muted-foreground", icon: null };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${m.cls}`}>{m.icon} {m.label}</span>;
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button disabled={page === 0} onClick={() => onChange(Math.max(0, page - 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40"><ChevronLeft size={12} /> Anterior</button>
      <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
      <button disabled={page + 1 >= totalPages} onClick={() => onChange(Math.min(totalPages - 1, page + 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40">Próxima <ChevronRight size={12} /></button>
    </div>
  );
}