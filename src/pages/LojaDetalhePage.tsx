import { useParams, useNavigate } from "react-router-dom";
import { stores } from "@/data/stores";
import { ArrowLeft, MessageCircle, Star, Flame, ShoppingBag } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

export default function LojaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = stores.find((s) => s.id === id);

  if (!store) {
    return (
      <div className="px-4 pt-12 text-center animate-slide-up">
        <span className="text-5xl block mb-3">🏪</span>
        <p className="text-foreground font-bold text-lg">Loja não encontrada</p>
        <button onClick={() => navigate("/")} className="mt-4 text-primary font-semibold text-sm">
          ← Voltar ao início
        </button>
      </div>
    );
  }

  const openWhatsApp = (message: string) => {
    trackEvent("click_pedir_produto", { store: store.id });
    trackAnalyticsEvent("partner_click", { partner_name: store.name, source: "store_page" });
    trackAnalyticsEvent("whatsapp_click", { source: "store_page" });
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary/20 to-background px-4 pt-6 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-4 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-center animate-slide-up">
          <span className="text-7xl block mb-3">{store.emoji}</span>
          <h1 className="text-2xl font-black text-foreground">{store.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{store.description}</p>
          {store.highlighted && (
            <span className="inline-flex items-center gap-1 mt-3 text-xs font-black bg-secondary/15 text-secondary px-3 py-1.5 rounded-full">
              <Flame size={12} /> Parceiro destaque
            </span>
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-5">
        {/* Offer */}
        {store.offer && (
          <div className="bg-secondary/15 border border-secondary/30 rounded-2xl p-4 text-center animate-slide-up">
            <p className="text-base font-black text-secondary flex items-center justify-center gap-1.5">
              <Flame size={18} /> {store.offer} <Flame size={18} />
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              🔥 Produção artesanal, estoque limitado!
            </p>
          </div>
        )}

        {/* Products */}
        <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary" /> Produtos disponíveis
          </h2>
          <div className="flex flex-col gap-3">
            {store.products.map((product, i) => (
              <div
                key={product.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm animate-slide-up"
                style={{ animationDelay: `${(i + 1) * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      R${product.priceMin} - R${product.priceMax}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Loja: {store.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openWhatsApp(product.whatsappMessage)}
                  className="w-full mt-3 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <MessageCircle size={16} />
                  Pedir via WhatsApp 💬
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        {store.ingredients && store.ingredients.length > 0 && (
          <div className="bg-accent/50 rounded-2xl p-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <p className="text-sm font-bold text-foreground mb-2">🧾 Ingredientes:</p>
            <div className="flex flex-wrap gap-2">
              {store.ingredients.map((ing) => (
                <span
                  key={ing}
                  className="text-xs bg-card px-3 py-1 rounded-full text-muted-foreground border border-border"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {store.reviews && store.reviews.length > 0 && (
          <div className="space-y-2 animate-slide-up" style={{ animationDelay: "280ms" }}>
            <p className="text-sm font-bold text-foreground">⭐ Avaliações de clientes</p>
            {store.reviews.map((r, i) => (
              <div key={i} className="flex items-center gap-2 bg-accent/30 rounded-xl px-4 py-3">
                <div className="flex shrink-0">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={12} className="text-secondary fill-secondary" />
                  ))}
                </div>
                <p className="text-xs text-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => openWhatsApp("Olá! Vi os produtos no EscolheAí 😄")}
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
          >
            <MessageCircle size={20} />
            📲 Falar com a loja 💬
          </button>
        </div>
      </div>
    </div>
  );
}
