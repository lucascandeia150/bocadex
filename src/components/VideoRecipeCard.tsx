import { useState } from "react";
import type { Food } from "@/data/foods";
import { Youtube, Play, ShoppingCart, ExternalLink, ChefHat, Clock, DollarSign, Lightbulb } from "lucide-react";
import { openBuyIngredient, openBuyIngredients } from "@/lib/monetization";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

interface VideoRecipeCardProps {
  food: Food;
}

export function VideoRecipeCard({ food }: VideoRecipeCardProps) {
  const [playing, setPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const videoId = food.recipe.videoUrl ? getYouTubeId(food.recipe.videoUrl) : null;

  if (!videoId) return null;

  const handlePlay = () => {
    setPlaying(true);
    trackAnalyticsEvent("video_embed_play", { food: food.name });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Video player / thumbnail */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={food.name}
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button onClick={handlePlay} className="absolute inset-0 w-full h-full group">
            <img
              src={getThumbnail(videoId)}
              alt={food.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center group-active:bg-foreground/40 transition-colors">
              <div className="bg-destructive rounded-full p-4 shadow-lg group-active:scale-95 transition-transform">
                <Play size={28} className="text-destructive-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Title bar */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl">{food.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{food.name}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} className="text-primary" /> {food.recipe.prepTime}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign size={11} /> ~R${food.recipe.costEstimate}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
          >
            {showDetails ? "Fechar" : "Ver receita"}
          </button>
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className="mt-4 space-y-4 animate-slide-up">
            {/* Ingredients */}
            <div>
              <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                <ChefHat size={14} className="text-primary" /> Ingredientes
              </h4>
              <ul className="space-y-1.5">
                {food.recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center justify-between gap-2">
                    <span className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span className="break-words">{ing}</span>
                    </span>
                    <button
                      onClick={() => openBuyIngredient(ing, food.name)}
                      className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg active:scale-95 transition-transform flex items-center gap-0.5 hover:bg-primary/20"
                    >
                      <ExternalLink size={10} /> Amazon
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buy all */}
            <button
              onClick={() => openBuyIngredients(food.name, food.recipe.ingredients)}
              className="w-full bg-[#FF9900]/10 text-[#FF9900] font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm border border-[#FF9900]/20"
            >
              <ShoppingCart size={16} /> 🛒 Comprar ingredientes na Amazon
            </button>

            {/* Steps */}
            <div>
              <h4 className="font-bold text-foreground mb-2">👨‍🍳 Modo de Preparo</h4>
              <ol className="space-y-2">
                {food.recipe.steps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-accent/60 rounded-xl p-3">
              <h4 className="font-bold text-foreground mb-1 flex items-center gap-1.5 text-sm">
                <Lightbulb size={14} className="text-secondary" /> Dica rápida
              </h4>
              <p className="text-xs text-muted-foreground">
                Compre ingredientes no atacado para economizar. Cozinhar em casa sempre sai mais barato!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
