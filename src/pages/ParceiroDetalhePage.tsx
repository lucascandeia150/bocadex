import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Package, ShoppingBag, Store as StoreIcon, Plus, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { ProductOrderModal } from "@/components/ProductOrderModal";
import { useCart } from "@/contexts/CartContext";

interface Partner {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  description: string;
  whatsapp: string;
  promotions: string | null;
  logo_url: string | null;
  uses_app_courier: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
}

export default function ParceiroDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const { totalItems, totalValue, partnerId: cartPartnerId } = useCart();
  const cartHasThisStore = cartPartnerId === partner?.id && totalItems > 0;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [pRes, prRes] = await Promise.all([
        supabase
          .from("partner_applications")
          .select("id, business_name, business_type, address, description, whatsapp, promotions, logo_url, uses_app_courier")
          .eq("id", id)
          .eq("status", "approved")
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("products")
          .select("id, name, description, image_url, price_min, price_max")
          .eq("partner_id", id)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
      ]);
      if (pRes.data) setPartner(pRes.data as Partner);
      if (prRes.data) setProducts(prRes.data as Product[]);
      setLoading(false);
    })();
  }, [id]);

  const openWhatsApp = (msg: string, source: string) => {
    if (!partner) return;
    trackAnalyticsEvent("partner_click", { partner_name: partner.business_name, source });
    trackAnalyticsEvent("whatsapp_click", { source });
    const phone = partner.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="pb-28">
        <div className="h-44 bg-muted animate-pulse" />
        <div className="px-4 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-muted animate-pulse border-4 border-background mx-auto" />
          <div className="h-5 bg-muted rounded mt-4 w-2/3 mx-auto animate-pulse" />
          <div className="h-3 bg-muted rounded mt-2 w-1/2 mx-auto animate-pulse" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-muted h-28 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="px-4 pt-12 text-center animate-slide-up">
        <span className="text-5xl block mb-3">🏪</span>
        <p className="text-foreground font-bold text-lg">Loja não encontrada</p>
        <button onClick={() => navigate("/lojas")} className="mt-4 text-primary font-semibold text-sm">
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="pb-44">
      {/* Banner com gradiente */}
      <div className="relative h-44 bg-gradient-to-br from-[hsl(142,71%,45%)] via-[hsl(142,71%,38%)] to-[hsl(24,95%,48%)] overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow-lg flex items-center justify-center active:scale-90 transition-transform z-10"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      {/* Logo + info */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4">
          {partner.logo_url ? (
            <img
              src={partner.logo_url}
              alt={partner.business_name}
              loading="lazy"
              className="w-24 h-24 rounded-2xl shadow-xl border-4 border-background object-cover bg-card shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl shadow-xl border-4 border-background bg-card flex items-center justify-center shrink-0">
              <StoreIcon size={36} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 pb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[hsl(142,70%,45%)] text-white px-2 py-0.5 rounded-full uppercase">
              <Clock size={9} /> Aberto
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-foreground mt-3 leading-tight">{partner.business_name}</h1>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {partner.business_type && (
            <span className="text-xs font-bold text-muted-foreground">{partner.business_type}</span>
          )}
          <span className="flex items-center gap-1 text-xs font-bold text-foreground">
            <Star size={12} className="fill-secondary text-secondary" /> Novo
          </span>
        </div>
        {partner.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-snug">{partner.description}</p>
        )}
        {partner.address && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin size={12} className="text-primary shrink-0" /> {partner.address}
          </p>
        )}
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-5 mt-5">
        {partner.promotions && (
          <div className="bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/40 rounded-2xl p-4 animate-slide-up">
            <p className="text-[10px] font-black text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">🔥 Promoções</p>
            <p className="text-sm text-foreground font-semibold whitespace-pre-line">{partner.promotions}</p>
          </div>
        )}

        <div className="animate-slide-up">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag size={16} className="text-primary" /> Produtos disponíveis
          </h2>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <Package size={28} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-semibold">Catálogo em breve</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fale direto com a loja pelo WhatsApp para saber o cardápio.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((p, i) => (
                <article
                  key={p.id}
                  className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-slide-up flex"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  <div className="flex-1 p-4 min-w-0">
                    <h3 className="text-base font-black text-foreground leading-tight">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-snug">{p.description}</p>
                    )}
                    {p.price_min != null && (
                      <p className="text-base font-black text-primary mt-2">
                        {p.price_max && p.price_max !== p.price_min
                          ? `R$${Number(p.price_min).toFixed(2)} – R$${Number(p.price_max).toFixed(2)}`
                          : `R$${Number(p.price_min).toFixed(2)}`}
                      </p>
                    )}
                  </div>
                  <div className="relative w-28 shrink-0 bg-gradient-to-br from-[hsl(142,60%,55%)] to-[hsl(24,90%,55%)]">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-lg">🍽️</div>
                    )}
                    <button
                      onClick={() => setOrderProduct(p)}
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      aria-label={`Adicionar ${p.name}`}
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="fixed left-0 right-0 z-40 px-4 pt-3 bg-background/95 backdrop-blur-sm border-t border-border animate-slide-up"
        style={{
          bottom: "calc(56px + env(safe-area-inset-bottom))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-sm mx-auto">
          {cartHasThisStore ? (
            <button
              onClick={() => navigate("/carrinho")}
              className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-black py-3.5 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-between gap-2 px-5 text-sm shadow-lg"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/25 text-white text-[11px] font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
                  {totalItems}
                </span>
                Ver carrinho
              </span>
              <span className="font-black">R${totalValue.toFixed(2)}</span>
            </button>
          ) : (
            <button
              onClick={() => openWhatsApp(`Olá! Vi a ${partner.business_name} no EscolheAí 😄`, "partner_page")}
              className="w-full bg-card border-2 border-[hsl(142,70%,45%)] text-[hsl(142,70%,38%)] font-black py-3.5 rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
            >
              <MessageCircle size={18} />
              Falar com a loja
            </button>
          )}
        </div>
      </div>

      {orderProduct && (
        <ProductOrderModal
          open={!!orderProduct}
          onClose={() => setOrderProduct(null)}
          partnerId={partner.id}
          storeName={partner.business_name}
          whatsapp={partner.whatsapp}
          productName={orderProduct.name}
          productId={orderProduct.id}
          unitPrice={orderProduct.price_min}
          hasDelivery={partner.uses_app_courier}
          onSent={() => {
            trackAnalyticsEvent("partner_click", { partner_name: partner.business_name, source: "add_to_cart" });
          }}
        />
      )}
    </div>
  );
}