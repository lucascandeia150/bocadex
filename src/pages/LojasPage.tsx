import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreCategory, stores, categoryLabels, getAllCategories } from "@/data/stores";
import { ShoppingBag, Flame, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { CardParceiro } from "@/components/CardParceiro";

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
}

export default function LojasPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "todas">("todas");
  const [dbPartners, setDbPartners] = useState<DbPartner[]>([]);
  const categories = getAllCategories();

  useEffect(() => {
    supabase
      .from("partner_applications")
      .select("id, business_name, business_type, address, description, whatsapp, promotions, logo_url, is_active")
      .eq("status", "approved")
      .eq("is_active", true)
      .then(({ data }) => { if (data) setDbPartners(data as DbPartner[]); });
  }, []);

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

  const filteredStores = activeCategory === "todas"
    ? stores
    : stores.filter((s) => s.category === activeCategory);

  const filteredDbPartners = activeCategory === "todas"
    ? dbPartners
    : dbPartners.filter((p) => mapBusinessType(p.business_type) === activeCategory);

  // Highlighted stores (hardcoded + db)
  const highlightedStores = stores.filter(s => s.highlighted);

  const hasResults = filteredStores.length > 0 || filteredDbPartners.length > 0;

  return (
    <div className="px-4 pt-6 pb-10">
      <BackButton />
      <div className="text-center mb-6 animate-bounce-in">
        <ShoppingBag className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Explorar Lojas 🛍️</h1>
        <p className="text-muted-foreground text-sm mt-1">Descubra parceiros perto de você</p>
      </div>

      {/* Parceiros em destaque */}
      {activeCategory === "todas" && highlightedStores.length > 0 && (
        <div className="max-w-sm mx-auto mb-6 animate-slide-up">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Flame size={14} className="text-secondary" /> Parceiros em destaque
          </h2>
          <div className="flex flex-col gap-3">
            {highlightedStores.map((store, i) => (
              <CardParceiro
                key={store.id}
                index={i}
                variant="highlight"
                partner={{
                  id: store.id,
                  name: store.name,
                  description: store.description,
                  logo: store.logo,
                  emoji: store.emoji,
                  offer: store.offer,
                  highlighted: true,
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
            }}
          />
        ))}

        {/* Hardcoded stores */}
        {filteredStores.map((store, i) => (
          <CardParceiro
            key={store.id}
            index={i + filteredDbPartners.length}
            partner={{
              id: store.id,
              name: store.name,
              description: store.description,
              logo: store.logo,
              emoji: store.emoji,
              category: `${categoryLabels[store.category].emoji} ${categoryLabels[store.category].label}`,
              highlighted: store.highlighted,
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

function StoreDetail({ store, onBack }: { store: Store; onBack: () => void }) {
  const openWhatsApp = (product: StoreProduct) => {
    trackEvent("click_pedir_produto", { store: store.id, product: product.id });
    const message = encodeURIComponent(product.whatsappMessage);
    window.open(`https://wa.me/${store.whatsapp}?text=${message}`, "_blank");
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-4 active:scale-95 transition-transform"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="max-w-sm mx-auto animate-slide-up">
        <div className="text-center mb-5">
          <span className="text-6xl block mb-2">{store.emoji}</span>
          <h1 className="text-xl font-black text-foreground">{store.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{store.description}</p>
          {store.highlighted && (
            <span className="inline-block mt-2 text-xs font-bold bg-secondary/15 text-secondary px-3 py-1 rounded-full">
              🔥 Parceiro local
            </span>
          )}
        </div>

        <h2 className="text-base font-bold text-foreground mb-3">Produtos disponíveis</h2>

        <div className="flex flex-col gap-3">
          {store.products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                  loading="lazy"
                />
              )}
              <div className="flex items-start gap-3">
                <span className="text-4xl">{product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    R${product.priceMin} - R${product.priceMax}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openWhatsApp(product)}
                className="w-full mt-3 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <MessageCircle size={16} />
                Falar com a loja 💬
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
