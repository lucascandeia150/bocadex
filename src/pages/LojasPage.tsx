import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StoreCategory, categoryLabels, getAllCategories } from "@/data/stores";
import { ShoppingBag, Flame, Handshake, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardParceiro } from "@/components/CardParceiro";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface DbPartner {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  description: string;
  whatsapp: string;
  promotions: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_featured?: boolean;
  is_demo?: boolean;
  visibility?: string;
}

export default function LojasPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "todas">("todas");
  const [dbPartners, setDbPartners] = useState<DbPartner[]>([]);
  const [query, setQuery] = useState("");
  const categories = getAllCategories();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const baseSelect = "id, business_name, business_type, address, description, whatsapp, promotions, logo_url, is_active, is_featured, is_demo, visibility";
    const q = isAdmin
      ? supabase.from("partner_applications").select(baseSelect).eq("status", "approved").eq("is_active", true)
      : supabase
      .from("partner_applications")
      .select(baseSelect)
      .eq("status", "approved")
      .eq("is_active", true);
    q.then(({ data }) => { if (data) setDbPartners(data as DbPartner[]); });
  }, [isAdmin]);

  // Map business_type to StoreCategory
  const mapBusinessType = (type: string): StoreCategory | null => {
    const map: Record<string, StoreCategory> = {
      "distribuidora": "distribuidoras",
      "lanchonete": "lanchonetes",
      "restaurante": "restaurantes",
      "pizzaria": "pizzarias",
      "café": "cafes",
      "doces": "doces",
      "bebidas": "distribuidoras",
    };
    return map[type.toLowerCase()] || null;
  };

  // Apenas parceiros reais do banco (lojas mockadas legadas removidas para evitar "Loja não encontrada")
  const dbFeatured = dbPartners.filter((p) => p.is_featured);
  const featuredDbIds = new Set(dbFeatured.map((p) => p.id));

  const mainDb = dbPartners.filter((p) => !featuredDbIds.has(p.id));

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredDbPartners = useMemo(() => {
    let list = activeCategory === "todas"
      ? mainDb
      : mainDb.filter((p) => mapBusinessType(p.business_type) === activeCategory);
    const q = norm(query.trim());
    if (q) {
      list = list.filter((p) =>
        norm(`${p.business_name} ${p.business_type} ${p.description}`).includes(q)
      );
    }
    return list;
  }, [mainDb, activeCategory, query]);

  const hasResults = filteredDbPartners.length > 0 ||
    (activeCategory === "todas" && !query.trim() && dbFeatured.length > 0);

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="text-center mb-6 animate-bounce-in">
        <ShoppingBag className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Explorar Lojas 🛍️</h1>
        <p className="text-muted-foreground text-sm mt-1">Descubra parceiros perto de você</p>
      </div>

      {/* Busca */}
      <div className="max-w-sm mx-auto mb-5 relative animate-slide-up">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar loja por nome ou categoria"
          className="w-full bg-card border border-border rounded-2xl py-3 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Limpar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Parceiros em destaque (DB + mocks únicos) */}
      {activeCategory === "todas" && !query.trim() && dbFeatured.length > 0 && (
        <div className="max-w-sm mx-auto mb-6 animate-slide-up">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Flame size={14} className="text-secondary" /> Parceiros em destaque
          </h2>
          <div className="flex flex-col gap-3">
            {dbFeatured.map((p, i) => (
              <CardParceiro
                key={`db-feat-${p.id}`}
                index={i}
                variant="highlight"
                partner={{
                  id: p.id,
                  business_name: p.business_name,
                  description: p.description,
                  logo_url: p.logo_url,
                  business_type: p.business_type,
                  offer: p.promotions,
                  highlighted: true,
                  is_demo: p.is_demo,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Category bar */}
      <div className="max-w-sm mx-auto mb-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          <CategoryChip
            label="Todas"
            emoji="🏪"
            active={activeCategory === "todas"}
            onClick={() => setActiveCategory("todas")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              label={categoryLabels[cat].label}
              emoji={categoryLabels[cat].emoji}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Store list */}
      <div className="max-w-sm mx-auto flex flex-col gap-3">
        {/* DB Partners */}
        {filteredDbPartners.map((p, i) => (
          <CardParceiro
            key={`db-${p.id}`}
            index={i}
            partner={{
              id: p.id,
              business_name: p.business_name,
              description: p.description,
              logo_url: p.logo_url,
              business_type: p.business_type,
              is_demo: p.is_demo,
            }}
          />
        ))}

        {/* Empty category message */}
        {!hasResults && (
          <div className="text-center py-12 animate-slide-up">
            <span className="text-5xl block mb-3">⚠️</span>
            <p className="text-foreground font-bold text-lg">
              Ainda não temos parceiros nesta categoria 😔
            </p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Quer indicar um parceiro? 🤝
            </p>
            <button
              onClick={() => navigate("/seja-parceiro")}
              className="gradient-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-2xl shadow-md active:scale-95 transition-transform inline-flex items-center gap-2"
            >
              <Handshake size={16} /> Quero indicar um parceiro 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ label, emoji, active, onClick }: { label: string; emoji: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {emoji} {label}
    </button>
  );
}

