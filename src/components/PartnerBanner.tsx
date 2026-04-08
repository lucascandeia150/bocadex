import { MessageCircle, ChefHat, Star, Flame, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { allItems } from "@/data/foods";
import { stores } from "@/data/stores";
import { RecipeModal } from "./RecipeModal";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import teteLogoOficial from "@/assets/partner/tete-logo-oficial.jpg";
import eprajaLogo from "@/assets/partner/epraja-logo.jpg";

const biscoito = allItems.find((f) => f.id === "biscoito-nata")!;
const teteStore = stores.find((s) => s.id === "biscoito-da-tete")!;
const eprajaStore = stores.find((s) => s.id === "e-pra-ja")!;

const teteProducts = [
  { name: "Nata Tradicional", emoji: "🍪" },
  { name: "Goiabinha", emoji: "🍓" },
  { name: "Doce de Leite", emoji: "🥛" },
  { name: "Morango", emoji: "🍓" },
  { name: "Flocos", emoji: "🍫" },
];

const teteReviews = [
  { text: "Muito bom e fresquinho!", stars: 5 },
  { text: "Melhor biscoito da região!", stars: 5 },
  { text: "Minha família amou, já pedi de novo!", stars: 5 },
];

export function PartnerBanner() {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [expandedTete, setExpandedTete] = useState(false);
  const navigate = useNavigate();

  const openWhatsApp = (e: React.MouseEvent, phone: string, message: string, partnerName: string) => {
    e.stopPropagation();
    trackEvent("click_partner_whatsapp", { partner: partnerName, source: "partner_banner" });
    trackAnalyticsEvent("partner_click", { partner_name: partnerName, source: "partner_banner" });
    trackAnalyticsEvent("whatsapp_click", { source: "partner_banner" });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Biscoito da Tetê */}
        <div
          className="w-full max-w-sm mx-auto rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden animate-slide-up cursor-pointer"
          onClick={() => setExpandedTete(!expandedTete)}
        >
          <div className="bg-secondary/15 px-4 py-2 flex items-center justify-center gap-2">
            <Flame size={14} className="text-secondary" />
            <span className="text-[11px] font-black text-secondary tracking-wide uppercase">
              Parceiro em destaque
            </span>
            <Flame size={14} className="text-secondary" />
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <img src={teteLogoOficial} alt="Biscoito da Tetê" loading="lazy" width={56} height={56} className="w-14 h-14 rounded-full shadow-md border-2 border-[hsl(30,30%,80%)] object-cover shrink-0" />
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

            <div className="mt-3 flex flex-wrap gap-1.5">
              {teteProducts.map((p) => (
                <span key={p.name} className="text-[11px] font-semibold bg-accent px-2.5 py-1 rounded-full text-accent-foreground">
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>

            <div className="mt-3 bg-secondary/15 border border-secondary/30 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-secondary flex items-center justify-center gap-1">
                <Flame size={16} /> 3 potinhos por R$20,00 <Flame size={16} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                🔥 Produto artesanal, estoque limitado!
              </p>
            </div>

            {expandedTete && (
              <div className="mt-3 space-y-3 animate-slide-up">
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
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-foreground">⭐ Avaliações:</p>
                  {teteReviews.map((r, i) => (
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
                  <ChefHat size={15} /> Ver receita
                </button>
                <button
                  onClick={(e) => openWhatsApp(e, "5573998719117", "Olá! Vi os biscoitos no EscolheAí 😄", "Biscoito da Tetê")}
                  className="flex-1 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-xs shadow-md"
                >
                  <MessageCircle size={15} /> Falar com a loja 💬
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground mt-2">
              {expandedTete ? "Toque para recolher ▲" : "Toque para ver mais detalhes ▼"}
            </p>
          </div>
        </div>

        {/* É Pra Já */}
        <div className="w-full max-w-sm mx-auto rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden animate-slide-up">
          <div className="bg-secondary/15 px-4 py-2 flex items-center justify-center gap-2">
            <Flame size={14} className="text-secondary" />
            <span className="text-[11px] font-black text-secondary tracking-wide uppercase">
              Parceiro em destaque
            </span>
            <Flame size={14} className="text-secondary" />
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <img src={eprajaLogo} alt="É Pra Já" loading="lazy" width={56} height={56} className="w-14 h-14 rounded-2xl shadow-md border-2 border-secondary/30 object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-foreground">É Pra Já 🍺</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  🍺 Cerveja gelada, é pra já!
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Cerveja gelada é pra já 🍻
                </p>
                <p className="text-[10px] text-destructive font-semibold mt-1">
                  ⚠️ Não fazemos entrega
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {eprajaStore?.products.map((p) => (
                <span key={p.id} className="text-[11px] font-semibold bg-accent px-2.5 py-1 rounded-full text-accent-foreground">
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>

            <div className="mt-3 bg-secondary/15 border border-secondary/30 rounded-xl p-3 text-center">
              <p className="text-sm font-black text-secondary flex items-center justify-center gap-1">
                <Flame size={16} /> Bebida gelada na hora! <Flame size={16} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                🔥 Parceiro com bebidas sempre geladas e preço justo!
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => navigate("/loja/e-pra-ja")}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
              >
                🏪 Ver loja completa <ArrowRight size={14} />
              </button>
              <button
                onClick={(e) => openWhatsApp(e, eprajaStore?.whatsapp || "", "Olá! Vi as bebidas no EscolheAí 🍻", "É Pra Já")}
                className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm shadow-md"
              >
                <MessageCircle size={16} /> Pedir agora 📲
              </button>
            </div>
          </div>
        </div>
      </div>

      <RecipeModal food={biscoito} open={recipeOpen} onOpenChange={setRecipeOpen} />
    </>
  );
}
