import { useState, useEffect } from "react";
import { Store, StoreCategory, StoreProduct, stores, categoryLabels, getAllCategories } from "@/data/stores";
import { ShoppingBag, MessageCircle, MapPin, ChevronRight, ArrowLeft, Store as StoreIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { BackButton } from "@/components/BackButton";

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
  const [activeCategory, setActiveCategory] = useState<StoreCategory | "todas">("todas");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
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

  const filteredStores = activeCategory === "todas"
    ? stores
    : stores.filter((s) => s.category === activeCategory);

  if (selectedStore) {
    return <StoreDetail store={selectedStore} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <BackButton />
      <div className="text-center mb-6 animate-bounce-in">
        <ShoppingBag className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Explorar Lojas 🛍️</h1>
        <p className="text-muted-foreground text-sm mt-1">Descubra parceiros perto de você</p>
      </div>

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
        {filteredStores.length > 0 ? (
          filteredStores.map((store, i) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store)}
              className="animate-slide-up text-left w-full"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`rounded-2xl border p-4 bg-card shadow-sm transition-all active:scale-[0.98] ${store.highlighted ? "border-secondary/50 ring-1 ring-secondary/20" : "border-border"}`}>
                {store.highlighted && (
                  <span className="inline-block mb-2 text-[10px] font-black bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full">
                    🔥 PARCEIRO DESTAQUE
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{store.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground truncate">{store.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{store.description}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-primary font-semibold">
                      <MapPin size={11} />
                      {categoryLabels[store.category].emoji} {categoryLabels[store.category].label}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-12 animate-slide-up">
            <span className="text-5xl block mb-3">🏗️</span>
            <p className="text-foreground font-bold text-lg">
              Ainda estamos adicionando novas lojas na sua região 😄
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve teremos mais opções para você!
            </p>
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
