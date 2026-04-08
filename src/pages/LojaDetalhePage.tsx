import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { stores } from "@/data/stores";
import { ArrowLeft, MessageCircle, Star, Flame, ShoppingBag, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

import teteBanner from "@/assets/partner/tete-banner.jpg";
import teteFlocos from "@/assets/partner/tete-flocos.jpg";
import tetePotinhos from "@/assets/partner/tete-potinhos.jpg";
import teteGoiabinha from "@/assets/partner/tete-goiabinha.jpg";
import teteDoceLeite from "@/assets/partner/tete-doce-leite.jpg";
import teteLogoOficial from "@/assets/partner/tete-logo-oficial.jpg";
import eprajaLogo from "@/assets/partner/epraja-logo.jpg";

interface GalleryImage {
  src: string;
  label: string;
  category: "prontos" | "producao" | "embalagem";
}

const storeGalleries: Record<string, GalleryImage[]> = {
  "biscoito-da-tete": [
    { src: teteBanner, label: "Biscoitos da Tetê", category: "prontos" },
    { src: teteGoiabinha, label: "Goiabinha 🍓", category: "producao" },
    { src: teteDoceLeite, label: "Doce de Leite 🥛", category: "producao" },
    { src: teteFlocos, label: "Flocos 🍫", category: "producao" },
    { src: tetePotinhos, label: "Embalagem nos potinhos", category: "embalagem" },
  ],
};

const storeLogos: Record<string, string> = {
  "biscoito-da-tete": teteLogoOficial,
  "e-pra-ja": eprajaLogo,
};

const productImageMap: Record<string, string> = {
  "goiabinha": teteGoiabinha,
  "doce-de-leite": teteDoceLeite,
  "flocos": teteFlocos,
  "nata-tradicional": tetePotinhos,
  "morango": teteGoiabinha,
};

export default function LojaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = stores.find((s) => s.id === id);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const gallery = storeGalleries[store.id] || [];

  const openWhatsApp = (message: string) => {
    trackEvent("click_pedir_produto", { store: store.id });
    trackAnalyticsEvent("partner_click", { partner_name: store.name, source: "store_page" });
    trackAnalyticsEvent("whatsapp_click", { source: "store_page" });
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const scrollGallery = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -220 : 220;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-gradient-to-b from-secondary/20 to-background px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-4 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-center animate-slide-up">
          {storeLogos[store.id] ? (
            <img src={storeLogos[store.id]} alt={store.name} loading="lazy" width={112} height={112} className="w-28 h-28 rounded-full mx-auto mb-3 shadow-lg border-4 border-[hsl(30,30%,80%)] object-cover" />
          ) : (
            <span className="text-7xl block mb-3">{store.emoji}</span>
          )}
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
        {/* Photo Gallery */}
        {gallery.length > 0 && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Camera size={14} className="text-primary" /> 📸 Fotos reais do produto
              </p>
              <div className="flex gap-1">
                <button onClick={() => scrollGallery("left")} className="p-1.5 rounded-full bg-accent active:scale-90 transition-transform">
                  <ChevronLeft size={14} className="text-foreground" />
                </button>
                <button onClick={() => scrollGallery("right")} className="p-1.5 rounded-full bg-accent active:scale-90 transition-transform">
                  <ChevronRight size={14} className="text-foreground" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            >
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setFullscreenIdx(i)}
                  className="shrink-0 snap-start active:scale-95 transition-transform"
                >
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border border-border shadow-sm relative">
                    <img
                      src={img.src}
                      alt={img.label}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-[10px] font-bold text-white">{img.label}</p>
                      <p className="text-[9px] text-white/70">
                        {img.category === "prontos" && "✨ Produto pronto"}
                        {img.category === "producao" && "👩‍🍳 Produção artesanal"}
                        {img.category === "embalagem" && "📦 Embalagem"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Offer */}
        {store.offer && (
          <div className="bg-secondary/15 border-2 border-secondary/40 rounded-2xl p-5 text-center animate-slide-up">
            <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">🔥 Promoção do dia</p>
            <p className="text-lg font-black text-secondary flex items-center justify-center gap-1.5">
              <Flame size={20} /> 3 potinhos por R$20,00 <Flame size={20} />
            </p>
            <p className="text-sm text-foreground mt-1 font-semibold">
              Leve 3 por apenas R$20,00 😍
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Preço unitário: R$8,00 · 🔥 Produção artesanal, estoque limitado!
            </p>
          </div>
        )}

        {/* Products */}
        <div className="animate-slide-up" style={{ animationDelay: "80ms" }}>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary" /> Produtos disponíveis
          </h2>
          <div className="flex flex-col gap-3">
            {store.products.map((product, i) => {
              const productImg = productImageMap[product.id];
              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  {productImg && (
                    <img
                      src={productImg}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{product.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                        <p className="text-sm font-black text-primary mt-1">
                          {product.priceMin === product.priceMax ? `R$${product.priceMin},00` : `R$${product.priceMin},00 - R$${product.priceMax},00`}
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
                </div>
              );
            })}
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
            onClick={() => openWhatsApp(
              store.id === "e-pra-ja"
                ? "Olá! Vi as bebidas no EscolheAí 🍻"
                : "Olá! Vi a promoção dos biscoitos no EscolheAí 😍"
            )}
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-base shadow-lg"
          >
            <MessageCircle size={20} />
            📲 Pedir agora 💬
          </button>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {fullscreenIdx !== null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setFullscreenIdx(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white active:scale-90 transition-transform z-10"
            onClick={() => setFullscreenIdx(null)}
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-2 w-full px-2">
            <button
              className="p-2 rounded-full bg-white/10 text-white active:scale-90 transition-transform shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIdx((prev) => (prev! > 0 ? prev! - 1 : gallery.length - 1));
              }}
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <img
                src={gallery[fullscreenIdx].src}
                alt={gallery[fullscreenIdx].label}
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>

            <button
              className="p-2 rounded-full bg-white/10 text-white active:scale-90 transition-transform shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenIdx((prev) => (prev! < gallery.length - 1 ? prev! + 1 : 0));
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <p className="text-white text-sm font-bold mt-4">{gallery[fullscreenIdx].label}</p>
          <p className="text-white/50 text-xs mt-1">
            {fullscreenIdx + 1} / {gallery.length}
          </p>
        </div>
      )}
    </div>
  );
}
