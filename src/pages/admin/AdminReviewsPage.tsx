import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface Feedback { id: string; rating: number; comment: string; options: string; created_at: string; }

export default function AdminReviewsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false }).limit(200);
      setFeedbacks((data as Feedback[]) || []);
      setLoading(false);
    })();
  }, []);

  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Avaliações</h1>
        <p className="text-sm text-muted-foreground">{feedbacks.length} avaliações · média <b>{avg}</b> ⭐</p>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <Star className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {feedbacks.map((f) => (
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
      )}
    </div>
  );
}
