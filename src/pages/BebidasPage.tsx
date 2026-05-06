import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecipeModal } from "@/components/RecipeModal";
import { drinks } from "@/data/foods";
import type { Food } from "@/data/foods";
import { Clock, DollarSign, ChefHat, Tag, Wine, Coffee, GlassWater, Sparkles, MessageCircle, Flame, ArrowRight, Store as StoreIcon } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { supabase } from "@/integrations/supabase/client";

type DrinkCategory = "todas" | "leve" | "econômico" | "especial" | "rápido";

const categories: { id: DrinkCategory; label: string; emoji: string }[] = [
  { id: "todas", label: "Todas", emoji: "🍹" },
  { id: "leve", label: "Refrescantes", emoji: "💧" },
  { id: "econômico", label: "Econômicas", emoji: "💰" },
  { id: "especial", label: "Especiais", emoji: "✨" },
  { id: "rápido", label: "Rápidas", emoji: "⚡" },
];

interface FeaturedDrinkPartner {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  whatsapp: string;
  logo_url: string | null;
  promotions: string | null;
}

export default function BebidasPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<DrinkCategory>("todas");
  const [selectedDrink, setSelectedDrink] = useState<Food | null>(null);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [featured, setFeatured] = useState<FeaturedDrinkPartner | null>(null);

  useEffect(() => {
    (async () => {
      // Prioriza parceiros do tipo bebidas/distribuidora; se não houver, usa o primeiro featured.
      const { data } = await supabase
        .from("partner_applications")
        .select("id, business_name, business_type, description, whatsapp, logo_url, promotions")
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: true });
      const list = (data ?? []) as FeaturedDrinkPartner[];
      const drinkPartner = list.find((p) =>
        /distribuidora|bebida|adega|conveni/i.test(p.business_type || "")
      );
      setFeatured(drinkPartner ?? list[0] ?? null);
    })();
  }, []);

  const filtered = activeCategory === "todas"
    ? drinks
    : drinks.filter((d) => d.tag === activeCategory);

  const handleDrinkClick = (drink: Food) => {
    setSelectedDrink(drink);
    setRecipeOpen(true);
    trackEvent("view_drink_recipe", { drink: drink.name });
  };

  const openFeaturedWhatsApp = () => {
    if (!featured) return;
    trackAnalyticsEvent("partner_click", { partner_name: featured.business_name, source: "bebidas_page" });
    trackAnalyticsEvent("whatsapp_click", { source: "bebidas_partner_banner" });
    const phone = (featured.whatsapp || "").replace(/\D/g, "");
    const message = encodeURIComponent(`Olá! Vi a ${featured.business_name} no Bocadex 🍻`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <div className="px-4 pt-8 pb-10">

      {/* Header */}
      <div className="text-center mb-6 animate-bounce-in">
        <Wine className="mx-auto text-secondary mb-2" size={36} />
        <h1 className="text-2xl font-black text-foreground">Bebidas & Drinks 🍹</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Distribuidoras, adegas e receitas de drinks
        </p>
      </div>

      {/* Partner Highlight - dinâmico do banco */}
      {featured && (
        <div className="mb-6 animate-slide-up">
          <div className="w-full rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden">
            <div className="bg-secondary/15 px-4 py-2 flex items-center justify-center gap-2">
              <Flame size={14} className="text-secondary" />
              <span className="text-[11px] font-black text-secondary tracking-wide uppercase">
                Parceiro em destaque
              </span>
              <Flame size={14} className="text-secondary" />
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                {featured.logo_url ? (
                  <img
                    src={featured.logo_url}
                    alt={featured.business_name}
                    loading="lazy"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-2xl shadow-md border-2 border-secondary/30 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <StoreIcon size={28} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-foreground">{featured.business_name}</h3>
                  {featured.business_type && (
                    <p className="text-xs text-muted-foreground mt-0.5">{featured.business_type}</p>
                  )}
                  {featured.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{featured.description}</p>
                  )}
                </div>
              </div>

              {featured.promotions && (
                <div className="mt-3 bg-secondary/15 border border-secondary/30 rounded-xl p-3 text-center">
                  <p className="text-sm font-black text-secondary flex items-center justify-center gap-1">
                    <Flame size={16} /> {featured.promotions} <Flame size={16} />
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-3">
                <button
                  onClick={() => navigate(`/parceiro/${featured.id}`)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
                >
                  🏪 Ver loja completa <ArrowRight size={14} />
                </button>
                <button
                  onClick={openFeaturedWhatsApp}
                  className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm shadow-md"
                >
                  <MessageCircle size={16} />
                  Pedir agora 📲
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide animate-slide-up">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
              activeCategory === cat.id
                ? "gradient-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-primary/30"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Coffee size={24} className="mx-auto text-secondary mb-1" />
          <p className="text-xs font-bold text-foreground">Cafés & Chás</p>
          <p className="text-[10px] text-muted-foreground">Quentes e acolhentes</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <GlassWater size={24} className="mx-auto text-primary mb-1" />
          <p className="text-xs font-bold text-foreground">Sucos & Águas</p>
          <p className="text-[10px] text-muted-foreground">Naturais e saudáveis</p>
        </div>
      </div>

      {/* Lista de bebidas */}
      <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
        {filtered.map((drink) => (
          <button
            key={drink.id}
            onClick={() => handleDrinkClick(drink)}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm active:scale-[0.98] transition-transform hover:border-primary/30 text-left group"
          >
            <span className="text-4xl">{drink.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">{drink.name}</h3>
                {drink.bestValue && (
                  <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">💰 Melhor custo</span>
                )}
                {drink.recommended && (
                  <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">⭐ Top</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{drink.reason}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-foreground font-semibold flex items-center gap-1">
                  <DollarSign size={12} className="text-primary" />
                  R${drink.priceMin}–{drink.priceMax}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} /> {drink.recipe.prepTime}
                </span>
                {drink.tag && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag size={10} /> {drink.tag}
                  </span>
                )}
              </div>
            </div>
            <ChefHat size={16} className="text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma bebida nessa categoria ainda 😕
          </p>
        </div>
      )}

      {/* CTA distribuidoras */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-5 text-center animate-slide-up" style={{ animationDelay: "150ms" }}>
        <Sparkles size={24} className="mx-auto text-secondary mb-2" />
        <h3 className="text-sm font-black text-foreground mb-1">Distribuidoras & Adegas</h3>
        <p className="text-xs text-muted-foreground">
          Parceiros locais de bebidas disponíveis aqui! 🍷🍺
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Quer ser parceiro? Entre em contato! 📩
        </p>
      </div>

      {selectedDrink && (
        <RecipeModal food={selectedDrink} open={recipeOpen} onOpenChange={setRecipeOpen} />
      )}
    </div>
  );
}
