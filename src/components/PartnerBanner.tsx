import { MessageCircle, ChefHat, Star, Flame } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { allItems } from "@/data/foods";
import { stores } from "@/data/stores";
import { RecipeModal } from "./RecipeModal";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

const biscoito = allItems.find((f) => f.id === "biscoito-nata")!;
const store = stores.find((s) => s.id === "biscoito-da-tete")!;

const products = [
  { name: "Nata Tradicional", emoji: "🍪" },
  { name: "Goiabinha", emoji: "🍓" },
  { name: "Doce de Leite", emoji: "🥛" },
  { name: "Morango", emoji: "🍓" },
  { name: "Flocos", emoji: "🍫" },
];

const reviews = [
  { text: "Muito bom e fresquinho!", stars: 5 },
  { text: "Melhor biscoito da região!", stars: 5 },
  { text: "Minha família amou, já pedi de novo!", stars: 5 },
];

export function PartnerBanner() {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("click_pedir_biscoito_tete", { item: "biscoito-nata", source: "partner_banner" });
    trackAnalyticsEvent("partner_click", { partner_name: "Biscoito da Tetê", source: "partner_banner" });
    trackAnalyticsEvent("whatsapp_click", { source: "partner_banner" });
    const message = encodeURIComponent("Olá! Vi os biscoitos no EscolheAí 😄");
    window.open(`https://wa.me/5573998719117?text=${message}`, "_blank");
  };

  return (
    <>
      <div
        className="w-full max-w-sm mx-auto rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden animate-slide-up cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Partner badge */}
        <div className="bg-secondary/15 px-4 py-2 flex items-center justify-center gap-2">
          <Flame size={14} className="text-secondary" />
          <span className="text-[11px] font-black text-secondary tracking-wide uppercase">
            Parceiro em destaque
          </span>
          <Flame size={14} className="text-secondary" />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <span className="text-5xl">🍪</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-foreground">Biscoito da Tetê</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                🤤 Biscoitos caseiros que derretem na boca!
              </p>
              <p className="text-[11px] text-muted-foreground">
                Feitos com carinho e ingredientes selecionados 😋
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {products.map((p) => (
              <span
                key={p.name}
                className="text-[11px] font-semibold bg-accent px-2.5 py-1 rounded-full text-accent-foreground"
              >
                {p.emoji} {p.name}
              </span>
            ))}
          </div>

          {/* Offer highlight */}
          <div className="mt-3 bg-secondary/15 border border-secondary/30 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-secondary flex items-center justify-center gap-1">
              <Flame size={16} /> 3 potinhos por R$20,00 <Flame size={16} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              🔥 Produto artesanal, estoque limitado!
            </p>
          </div>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 space-y-3 animate-slide-up">
              {/* Ingredients */}
              <div className="bg-accent/50 rounded-xl p-3">
                <p className="text-xs font-bold text-foreground mb-1.5">🧾 Ingredientes:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Maisena", "Leite condensado desnatado", "Manteiga"].map((ing) => (
                    <span key={ing} className="text-[10px] bg-card px-2 py-0.5 rounded-full text-muted-foreground border border-border">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-foreground">⭐ Avaliações:</p>
                {reviews.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-accent/30 rounded-lg px-3 py-2">
                    <div className="flex">
                      {Array.from({ length: r.stars }).map((_, j) => (
                        <Star key={j} size={10} className="text-secondary fill-secondary" />
                      ))}
                    </div>
                    <p className="text-[11px] text-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/loja/biscoito-da-tete"); }}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
            >
              🏪 Ver loja completa
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setRecipeOpen(true); }}
                className="flex-1 bg-accent text-accent-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-xs"
              >
                <ChefHat size={15} />
                Ver receita
              </button>
              <button
                onClick={openWhatsApp}
                className="flex-1 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs shadow-md"
              >
                <MessageCircle size={15} />
                Falar com a loja 💬
              </button>
            </div>
          </div>

          {/* Tap hint */}
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            {expanded ? "Toque para recolher ▲" : "Toque para ver mais detalhes ▼"}
          </p>
        </div>
      </div>

      <RecipeModal food={biscoito} open={recipeOpen} onOpenChange={setRecipeOpen} />
    </>
  );
}
