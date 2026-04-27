import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter, RefreshCw, Search, Settings2 } from "lucide-react";
import AdminDeliveriesTab from "@/components/admin/AdminDeliveriesTab";

interface Delivery {
  id: string;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  status: string;
  fee: number;
  app_fee: number;
  order_value: number;
  created_at: string;
}

const STATUSES = [
  { id: "all", label: "Todos", color: "bg-muted text-muted-foreground" },
  { id: "disponivel", label: "Aguardando", color: "bg-blue-500/10 text-blue-600" },
  { id: "aceita", label: "Em preparo", color: "bg-yellow-500/10 text-yellow-600" },
  { id: "em_andamento", label: "A caminho", color: "bg-orange-500/10 text-orange-600" },
  { id: "concluida", label: "Concluída", color: "bg-green-500/10 text-green-600" },
  { id: "cancelada", label: "Cancelada", color: "bg-red-500/10 text-red-600" },
];

const PAGE_SIZE = 25;

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showLegacy, setShowLegacy] = useState(false);

  const load = async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("deliveries")
      .select("id,partner_name,order_description,delivery_address,status,fee,app_fee,order_value,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (status !== "all") q = q.eq("status", status);
    if (search.trim()) q = q.or(`partner_name.ilike.%${search}%,order_description.ilike.%${search}%,delivery_address.ilike.%${search}%`);
    const { data, count } = await q;
    setRows((data as Delivery[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, status]);

  // Realtime: refresh current page on changes
  useEffect(() => {
    const ch = supabase.channel("admin-orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [page, status, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const statusInfo = (s: string) => STATUSES.find((x) => x.id === s) || STATUSES[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{total} pedidos no total · página {page + 1} de {totalPages}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLegacy((v) => !v)} className="flex items-center gap-1 text-xs font-bold bg-muted hover:bg-muted/70 px-3 py-2 rounded-lg">
            <Settings2 size={12} /> {showLegacy ? "Ver lista" : "Gerenciar (avançado)"}
          </button>
          <button onClick={load} className="p-2 rounded-lg bg-muted hover:bg-muted/70" title="Atualizar">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showLegacy ? (
        <div className="bg-card border border-border rounded-2xl p-4">
          <AdminDeliveriesTab />
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
                placeholder="Buscar por loja, pedido ou endereço... (Enter)"
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
              <div className="p-4 space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</div>
            ) : (
              <div className="divide-y divide-border">
                {rows.map((d) => {
                  const s = statusInfo(d.status);
                  return (
                    <Link key={d.id} to={`/admin/dashboard/orders/${d.id}`} className="p-3 hover:bg-muted/30 transition-colors flex items-center gap-3 cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-foreground truncate">{d.partner_name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.color}`}>{s.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{d.order_description}</p>
                        <p className="text-[11px] text-muted-foreground truncate">📍 {d.delivery_address}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-foreground">{fmt(Number(d.order_value || 0))}</p>
                        <p className="text-[10px] text-muted-foreground">taxa {fmt(Number(d.app_fee || 0))}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Pager page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        disabled={page === 0}
        onClick={() => onChange(Math.max(0, page - 1))}
        className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40"
      >
        <ChevronLeft size={12} /> Anterior
      </button>
      <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
      <button
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40"
      >
        Próxima <ChevronRight size={12} />
      </button>
    </div>
  );
}