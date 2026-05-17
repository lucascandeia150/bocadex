import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, MapPin, ChevronDown, User as UserIcon } from "lucide-react";
import type { Food } from "@/data/foods";
import { HomeConversion } from "@/components/HomeConversion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface HomePageProps {
  onChoose: (food: Food) => void;
}

const CATEGORIES = [
  { label: "Hambúrguer", emoji: "🍔", q: "Hambúrguer" },
  { label: "Pizza", emoji: "🍕", q: "Pizza" },
  { label: "Salgados", emoji: "🥟", q: "Salgados" },
  { label: "Bebidas", emoji: "🥤", q: "Bebidas" },
  { label: "Açaí", emoji: "🍧", q: "Açaí" },
  { label: "Doces", emoji: "🍰", q: "Doces" },
  { label: "Marmitex", emoji: "🍱", q: "Marmitex" },
];

const TAGLINES = [
  "Tá com fome hoje?",
  "Escolheu, pediu, chegou.",
  "O que vai ser agora?",
  "Bora pedir algo bom?",
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomePage({ onChoose: _onChoose }: HomePageProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAddress(null); return; }
    (async () => {
      const { data } = await supabase
        .from("user_addresses")
        .select("label,address,is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setAddress(data.address);
    })();
  }, [user]);

  const firstName = useMemo(() => {
    const n = profile?.name?.trim() || user?.email?.split("@")[0] || "";
    return n ? n.split(" ")[0] : "";
  }, [profile, user]);

  const tagline = useMemo(() => TAGLINES[new Date().getDate() % TAGLINES.length], []);

  return (
    <div className="relative pb-10 bg-background min-h-screen">
      {/* HEADER compacto */}
      <div className="relative bg-[hsl(142,71%,45%)] pt-4 pb-14 px-5 rounded-b-3xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(user ? "/perfil" : "/auth")}
            className="flex-1 text-left active:scale-[0.98] transition-transform min-w-0"
            aria-label="Endereço de entrega"
          >
            <p className="text-white/90 text-[11px] font-bold">
              {greeting()}{firstName ? `, ${firstName}` : ""} 👋
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-white">
              <MapPin size={14} strokeWidth={2.5} />
              <span className="text-[13px] font-extrabold truncate">
                {address || (user ? "Adicionar endereço" : "Entrar para entregar")}
              </span>
              <ChevronDown size={14} strokeWidth={2.5} className="opacity-90 shrink-0" />
            </div>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/pedidos")}
              aria-label="Notificações"
              className="w-9 h-9 rounded-full bg-white/25 no-blur flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Bell size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate(user ? "/perfil" : "/auth")}
              aria-label="Perfil"
              className="w-9 h-9 rounded-full bg-white text-[hsl(142,71%,38%)] flex items-center justify-center font-black text-sm shadow-sm active:scale-90 transition-transform"
            >
              {firstName ? firstName.charAt(0).toUpperCase() : <UserIcon size={16} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        <h1 className="text-white text-[15px] font-extrabold mt-3">
          {tagline}
        </h1>
      </div>

      {/* SEARCH (overlapping header) */}
      <div className="px-5 -mt-8 relative z-20">
        <button
          onClick={() => navigate("/buscar")}
          className="w-full bg-card border border-border/60 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)] active:scale-[0.99] transition-transform"
          aria-label="Buscar lojas, comidas ou produtos"
        >
          <Search size={18} className="text-primary" strokeWidth={2.5} />
          <span className="text-[13px] text-muted-foreground font-semibold flex-1 text-left">
            Buscar pratos, lojas ou bebidas…
          </span>
        </button>
      </div>

      {/* CATEGORIES — scroll horizontal */}
      <section className="mt-5 animate-slide-up">
        <h2 className="text-[13px] font-black text-foreground mb-2.5 px-5 uppercase tracking-wide opacity-70">
          Categorias
        </h2>
        <div className="flex gap-2.5 overflow-x-auto px-5 pb-2 scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => navigate(`/buscar?q=${encodeURIComponent(c.q)}`)}
              className="snap-start shrink-0 flex flex-col items-center gap-1.5 px-3 py-3 min-w-[78px] rounded-2xl bg-card border border-border/60 shadow-sm active:scale-95 transition-all hover:border-primary/40"
            >
              <div className="w-12 h-12 rounded-2xl bg-[hsl(142,50%,96%)] flex items-center justify-center text-2xl">
                <span>{c.emoji}</span>
              </div>
              <span className="text-[11px] font-extrabold text-foreground">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CONTENT */}
      <div className="px-5 mt-3 flex flex-col items-center">
        <HomeConversion />
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-6">
        © 2026 Bocadex Delivery's — Feito com ❤️ no Brasil
      </p>
    </div>
  );
}
