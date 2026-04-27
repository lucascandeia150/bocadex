import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Filter, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface Feedback { id: string; rating: number; comment: string; options: string; created_at: string; }

export default function AdminReviewsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false }).limit(1000);
    setFeedbacks((data as Feedback[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "—";
  const filtered = useMemo(
    () => filter === "all" ? feedbacks : feedbacks.filter((f) => f.rating === filter),
    [feedbacks, filter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  useEffect(() => { setPage(0); }, [filter]);

  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0];
    feedbacks.forEach((f) => { if (f.rating >= 1 && f.rating <= 5) d[f.rating - 1] += 1; });
    return d;
  }, [feedbacks]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-foreground">Avaliações</h1>
          <p className="text-sm text-muted-foreground">{feedbacks.length} avaliações · média <b>{avg}</b> ⭐</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-muted hover:bg-muted/70" title="Atualizar"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="bg-card border border-border rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <span className="text-xs font-black text-foreground">{n}</span>
              <Star size={10} className="fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">{dist[n - 1]}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="text-muted-foreground shrink-0" />
        {(["all", 5, 4, 3, 2, 1] as const).map((f) => (
          <button
            key={String(f)}
            onClick={() => setFilter(f as any)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "Todos" : `${f} ⭐`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Star className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
        </div>
      ) : (
        <>
        <div className="grid gap-2">
          {pageItems.map((f) => (
            <div key={f.id} className="bg-card border border-border rounded-2xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((n) => <Star key={n} size={14} className={n <= f.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"} />)}
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(f.created_at).toLocaleString("pt-BR")}</span>
              </div>
              {f.comment && <p className="text-sm text-foreground">{f.comment}</p>}
              {f.options && <p className="text-[11px] text-muted-foreground mt-1 italic">{f.options}</p>}
            </div>
          ))}
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-end gap-2">
            <button disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40"><ChevronLeft size={12} /> Anterior</button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage(Math.min(totalPages - 1, page + 1))} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-muted hover:bg-muted/70 disabled:opacity-40">Próxima <ChevronRight size={12} /></button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
