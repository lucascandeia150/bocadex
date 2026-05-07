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
  { label: "Hambúrguer", emoji: "🍔", q: "Hambúrguer", from: "from-[hsl(24,95%,60%)]", to: "to-[hsl(24,95%,48%)]" },
  { label: "Pizza", emoji: "🍕", q: "Pizza", from: "from-[hsl(45,95%,60%)]", to: "to-[hsl(24,95%,53%)]" },
  { label: "Bebidas", emoji: "🥤", q: "Bebidas", from: "from-[hsl(200,80%,55%)]", to: "to-[hsl(180,70%,45%)]" },
  { label: "Doces", emoji: "🍰", q: "Doces", from: "from-[hsl(330,75%,65%)]", to: "to-[hsl(300,60%,55%)]" },
  { label: "Marmitex", emoji: "🍱", q: "Marmitex", from: "from-[hsl(142,60%,50%)]", to: "to-[hsl(142,71%,38%)]" },
  { label: "Salgados", emoji: "🥟", q: "Salgados", from: "from-[hsl(35,85%,58%)]", to: "to-[hsl(20,85%,50%)]" },
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

  return (
    <div className="relative pb-10 overflow-hidden">
      {/* HEADER GRADIENT */}
      <div className="relative bg-gradient-to-br from-[hsl(142,71%,42%)] via-[hsl(142,65%,38%)] to-[hsl(160,70%,32%)] pt-5 pb-20 px-5 rounded-b-[2rem] shadow-lg">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 rounded-full bg-[hsl(24,95%,60%)]/20 blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-3">
          <button
            onClick={() => navigate(user ? "/perfil" : "/auth")}
            className="flex-1 text-left active:scale-[0.98] transition-transform"
            aria-label="Trocar endereço"
          >
            <p className="text-white/90 text-xs font-bold tracking-wide uppercase">
              {greeting()}{firstName ? `, ${firstName}` : " 👋"}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-white">
              <MapPin size={16} strokeWidth={2.5} />
              <span className="text-sm font-extrabold truncate max-w-[220px]">
                {address || (user ? "Adicionar endereço" : "Entrar para entregar")}
              </span>
              <ChevronDown size={16} strokeWidth={2.5} className="opacity-90" />
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/pedidos")}
              aria-label="Notificações"
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Bell size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate(user ? "/perfil" : "/auth")}
              aria-label="Perfil"
              className="w-10 h-10 rounded-full bg-white text-[hsl(142,71%,38%)] flex items-center justify-center font-black text-sm shadow-md active:scale-90 transition-transform"
            >
              {firstName ? firstName.charAt(0).toUpperCase() : <UserIcon size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* SLOGAN */}
        <div className="relative mt-5">
          <h1 className="text-white text-2xl font-black leading-tight">
            Escolheu, pediu, <span className="text-[hsl(45,100%,70%)]">chegou.</span>
          </h1>
          <p className="text-white/85 text-xs font-semibold mt-1">
            Sua fome resolvida em poucos toques.
          </p>
        </div>
      </div>

      {/* SEARCH (overlapping header) */}
      <div className="px-5 -mt-12 relative z-20">
        <button
          onClick={() => navigate("/buscar")}
          className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-3 shadow-xl active:scale-[0.99] transition-transform"
          aria-label="Buscar lojas, comidas ou produtos"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search size={18} className="text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-sm text-muted-foreground font-semibold flex-1 text-left">
            Buscar lojas, comidas ou produtos
          </span>
        </button>
      </div>

      {/* CATEGORIES */}
      <section className="mt-6 px-5 animate-slide-up">
        <h2 className="text-base font-black text-foreground mb-3 px-1">Categorias</h2>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => navigate(`/buscar?q=${encodeURIComponent(c.q)}`)}
              className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border shadow-sm active:scale-95 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center text-2xl shadow-md group-active:scale-90 transition-transform`}
              >
                <span className="drop-shadow-sm">{c.emoji}</span>
              </div>
              <span className="text-[11px] font-extrabold text-foreground text-center leading-tight">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CONTENT (Promoções, Lojas, Pedidos rápidos) */}
      <div className="px-5 mt-2 flex flex-col items-center">
        <HomeConversion />
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-6">
        © 2026 Bocadex — Feito com ❤️ no Brasil
      </p>
    </div>
  );
}
