import { MessageCircle, ChefHat } from "lucide-react";
import { useState } from "react";
import { allItems } from "@/data/foods";
import { RecipeModal } from "./RecipeModal";
import { trackEvent } from "@/lib/analytics";

const biscoito = allItems.find((f) => f.id === "biscoito-nata")!;

export function PartnerBanner() {
  const [recipeOpen, setRecipeOpen] = useState(false);

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("click_pedir_biscoito_nata", { item: "biscoito-nata", source: "partner_banner" });
    const message = encodeURIComponent(
      "Olá! Vim pelo app EscolheAí e gostaria de mais informações 😄"
    );
    window.open(`https://wa.me/5527988330329?text=${message}`, "_blank");
  };

  return (
    <>
      <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden animate-slide-up">
        {/* Partner badge */}
        <div className="bg-secondary/15 px-4 py-1.5 flex items-center justify-center gap-2">
          <span className="text-[11px] font-black text-secondary tracking-wide">🔥 PARCEIRO LOCAL • RECOMENDADO HOJE</span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-5xl">{biscoito.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-foreground">{biscoito.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{biscoito.reason}</p>
              <p className="text-sm font-semibold text-primary mt-1">
                R${biscoito.priceMin} - R${biscoito.priceMax}{" "}
                <span className="text-xs font-normal text-muted-foreground">(estimado)</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setRecipeOpen(true)}
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
      </div>

      <RecipeModal food={biscoito} open={recipeOpen} onOpenChange={setRecipeOpen} />
    </>
  );
}
