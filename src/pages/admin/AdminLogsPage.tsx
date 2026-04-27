import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, RefreshCw, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface Log { id: string; actor_type: string; actor_label: string | null; action: string; entity_type: string | null; entity_id: string | null; description: string; metadata: Record<string, unknown>; created_at: string; }

const ACTOR_COLOR: Record<string, string> = {
  admin: "bg-primary/10 text-primary", partner: "bg-orange-500/10 text-orange-600",
  courier: "bg-blue-500/10 text-blue-600", customer: "bg-purple-500/10 text-purple-600",
  webhook: "bg-yellow-500/10 text-yellow-600", system: "bg-muted text-muted-foreground",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  const load = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (filter !== "all") q = q.eq("actor_type", filter);
    const { data, count } = await q;
    setLogs((data as Log[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-logs").on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_audit_logs" }, () => { if (page === 0) load(); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Logs / Auditoria</h1>
          <p className="text-sm text-muted-foreground">{total} eventos · página {page + 1} de {totalPages}</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-muted hover:bg-muted/70" title="Atualizar"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="text-muted-foreground shrink-0" />
        {["all", "admin", "partner", "courier", "customer", "webhook", "system"].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(0); }} className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-colors ${filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{f === "all" ? "Todos" : f}</button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center"><ScrollText className="mx-auto text-muted-foreground mb-2" size={28} /><p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p><p className="text-[11px] text-muted-foreground mt-1">Eventos aparecerão aqui automaticamente conforme o sistema for usado.</p></div>
        ) : logs.map((l) => (
          <div key={l.id} className="p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-2 flex-wrap">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${ACTOR_COLOR[l.actor_type] || ACTOR_COLOR.system}`}>{l.actor_type}</span>
              <span className="text-xs font-bold text-foreground">{l.action}</span>
              {l.entity_type && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ""}</span>}
              <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
            </div>
            {l.description && <p className="text-xs text-muted-foreground mt-1">{l.description}</p>}
            {l.actor_label && <p className="text-[10px] text-muted-foreground/70 mt-0.5">por {l.actor_label}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <button disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40"><ChevronLeft size={12} /> Anterior</button>
        <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(Math.min(totalPages - 1, page + 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40">Próxima <ChevronRight size={12} /></button>
      </div>
    </div>
  );
}
