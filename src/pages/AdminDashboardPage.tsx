import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, MousePointerClick, Star, MessageCircle, Trash2, LogOut,
  BarChart3, TrendingUp, Clock, RefreshCw, Handshake, CheckCircle, XCircle,
  ChefHat, Video, Link2
} from "lucide-react";
import AdminRecipesTab from "@/components/admin/AdminRecipesTab";
import AdminVideosTab from "@/components/admin/AdminVideosTab";
import AdminAffiliateTab from "@/components/admin/AdminAffiliateTab";

interface PartnerApplication {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  description: string;
  whatsapp: string;
  promotions: string | null;
  images: string[];
  status: string;
  created_at: string;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  options: string;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

type Tab = "overview" | "feedbacks" | "clicks" | "messages" | "partners" | "recipes" | "videos" | "affiliates";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [partners, setPartners] = useState<PartnerApplication[]>([]);
  const [dbRecipes, setDbRecipes] = useState<any[]>([]);
  const [dbVideos, setDbVideos] = useState<any[]>([]);
  const [dbAffiliateLinks, setDbAffiliateLinks] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/admin"); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/admin");
      return;
    }

    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [fbRes, evRes, ptRes] = await Promise.all([
      supabase.from("feedbacks").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("partner_applications").select("*").order("created_at", { ascending: false }),
    ]);
    setFeedbacks((fbRes.data as Feedback[]) || []);
    setEvents((evRes.data as AnalyticsEvent[]) || []);
    setPartners((ptRes.data as PartnerApplication[]) || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    toast.success("Excluído ✅");
  };

  const updatePartnerStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("partner_applications").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    toast.success(status === "approved" ? "Aprovado ✅" : "Rejeitado ❌");
  };

  // Stats
  const totalAccess = events.filter((e) => e.event_type === "page_view").length;
  const totalClicks = events.filter((e) => e.event_type === "partner_click").length;
  const whatsappClicks = events.filter((e) => e.event_type === "whatsapp_click").length;
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((a, f) => a + f.rating, 0) / feedbacks.length).toFixed(1)
    : "–";
  const totalComments = feedbacks.filter((f) => f.comment.trim()).length;

  // Partner click breakdown
  const partnerClicks: Record<string, number> = {};
  events.filter((e) => e.event_type === "partner_click").forEach((e) => {
    const name = String((e.event_data as Record<string, unknown>)?.partner_name || "Desconhecido");
    partnerClicks[name] = (partnerClicks[name] || 0) + 1;
  });

  const sortedPartners = Object.entries(partnerClicks).sort((a, b) => b[1] - a[1]);

  // Suggestions from events
  const suggestions = events.filter((e) => e.event_type === "suggestion_generated");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-black text-foreground flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" /> Painel Admin
          </h1>
          <p className="text-xs text-muted-foreground">EscolheAí Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 rounded-xl bg-muted active:scale-90 transition-transform">
            <RefreshCw size={16} className="text-muted-foreground" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-destructive/10 active:scale-90 transition-transform">
            <LogOut size={16} className="text-destructive" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 overflow-x-auto">
        {([
          { id: "overview", label: "Visão Geral", icon: <TrendingUp size={14} /> },
          { id: "feedbacks", label: "Avaliações", icon: <Star size={14} /> },
          { id: "clicks", label: "Cliques", icon: <MousePointerClick size={14} /> },
          { id: "messages", label: "Sugestões", icon: <MessageCircle size={14} /> },
          { id: "partners", label: "Parceiros", icon: <Handshake size={14} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === "overview" && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Users size={20} />} label="Acessos" value={totalAccess} color="text-primary" />
              <StatCard icon={<MousePointerClick size={20} />} label="Cliques parceiros" value={totalClicks} color="text-secondary" />
              <StatCard icon={<Star size={20} />} label="Média avaliações" value={avgRating} color="text-yellow-500" />
              <StatCard icon={<MessageCircle size={20} />} label="Comentários" value={totalComments} color="text-blue-500" />
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <MousePointerClick size={14} className="text-secondary" /> WhatsApp Cliques
              </h3>
              <p className="text-2xl font-black text-foreground">{whatsappClicks}</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-3">⭐ Últimas avaliações</h3>
              {feedbacks.slice(0, 3).map((f) => (
                <div key={f.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{"⭐".repeat(f.rating)}</span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">{f.comment || "(sem comentário)"}</span>
                </div>
              ))}
              {feedbacks.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma avaliação ainda</p>}
            </div>
          </div>
        )}

        {tab === "feedbacks" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-base font-black text-foreground">Avaliações ({feedbacks.length})</h2>
            {feedbacks.map((f) => (
              <div key={f.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{"⭐".repeat(f.rating)}</span>
                      <span className="text-xs text-muted-foreground">({f.rating}/5)</span>
                    </div>
                    {f.options && f.options !== "Nenhuma" && (
                      <p className="text-xs text-primary font-bold mb-1">{f.options}</p>
                    )}
                    <p className="text-sm text-foreground">{f.comment || "(sem comentário)"}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock size={10} /> {new Date(f.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFeedback(f.id)}
                    className="p-2 rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhuma avaliação recebida ainda 📭</p>
            )}
          </div>
        )}

        {tab === "clicks" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-base font-black text-foreground">Cliques nos Parceiros</h2>
            {sortedPartners.length > 0 ? sortedPartners.map(([name, count]) => (
              <div key={name} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{name}</span>
                <span className="text-sm font-black text-primary">{count} cliques</span>
              </div>
            )) : (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhum clique registrado ainda 📊</p>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-base font-black text-foreground">Sugestões Geradas ({suggestions.length})</h2>
            {suggestions.slice(0, 50).map((s) => (
              <div key={s.id} className="bg-card rounded-2xl border border-border p-3">
                <p className="text-xs font-bold text-primary">
                  {String((s.event_data as Record<string, unknown>)?.mode || "–")}
                </p>
                <p className="text-sm text-foreground">
                  {String((s.event_data as Record<string, unknown>)?.food_name || "–")}
                  {(s.event_data as Record<string, unknown>)?.drink_name && ` + ${String((s.event_data as Record<string, unknown>)?.drink_name)}`}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(s.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhuma sugestão registrada ainda 🎯</p>
            )}
          </div>
        )}

        {tab === "partners" && (
          <div className="space-y-3 animate-slide-up">
            <h2 className="text-base font-black text-foreground">Cadastros de Parceiros ({partners.length})</h2>
            {partners.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{p.business_name}</h3>
                    <span className="text-xs text-primary font-semibold">{p.business_type}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === "approved" ? "bg-green-100 text-green-700" :
                    p.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.status === "approved" ? "Aprovado" : p.status === "rejected" ? "Rejeitado" : "Pendente"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">📍 {p.address}</p>
                <p className="text-xs text-foreground">{p.description}</p>
                <p className="text-xs text-muted-foreground">📱 {p.whatsapp}</p>
                {p.promotions && <p className="text-xs text-primary">🎉 {p.promotions}</p>}
                {p.images && p.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {p.images.map((img, i) => (
                      <img key={i} src={img} alt="Parceiro" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock size={10} /> {new Date(p.created_at).toLocaleString("pt-BR")}
                </p>
                {p.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => updatePartnerStatus(p.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-bold">
                      <CheckCircle size={12} /> Aprovar
                    </button>
                    <button onClick={() => updatePartnerStatus(p.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold">
                      <XCircle size={12} /> Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {partners.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhum cadastro de parceiro ainda 🤝</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
