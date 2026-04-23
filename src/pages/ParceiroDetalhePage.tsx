import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Package, ShoppingBag, Store as StoreIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

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
      <div className="px-4 pt-12 text-center animate-slide-up">
        <p className="text-muted-foreground text-sm">Carregando loja...</p>
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
    <div className="pb-28">
      <div className="bg-gradient-to-b from-secondary/20 to-background px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-4 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-center animate-slide-up">
          {partner.logo_url ? (
            <img
              src={partner.logo_url}
              alt={partner.business_name}
              loading="lazy"
              className="w-28 h-28 rounded-full mx-auto mb-3 shadow-lg border-4 border-card object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-full mx-auto mb-3 shadow-lg border-4 border-card bg-muted flex items-center justify-center">
              <StoreIcon size={42} className="text-muted-foreground" />
            </div>
          )}
          <h1 className="text-2xl font-black text-foreground">{partner.business_name}</h1>
          <p className="text-xs uppercase tracking-wide text-primary font-bold mt-1">{partner.business_type}</p>
          {partner.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{partner.description}</p>
          )}
          {partner.address && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <MapPin size={12} className="text-primary shrink-0" />
              {partner.address}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-5">
        {partner.promotions && (
          <div className="bg-secondary/15 border-2 border-secondary/40 rounded-2xl p-4 text-center animate-slide-up">
            <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">🔥 Promoções</p>
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
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-36 object-cover" />
                  )}
                  <div className="p-4">
                    <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    )}
                    {p.price_min != null && (
                      <p className="text-sm font-black text-primary mt-1">
                        {p.price_max && p.price_max !== p.price_min
                          ? `R$${Number(p.price_min).toFixed(2)} – R$${Number(p.price_max).toFixed(2)}`
                          : `R$${Number(p.price_min).toFixed(2)}`}
                      </p>
                    )}
                    <button
                      onClick={() =>
                        openWhatsApp(
                          `Olá! Tenho interesse em "${p.name}" (vi no EscolheAí) 😄`,
                          "partner_product",
                        )
                      }
                      className="w-full mt-3 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                    >
                      <MessageCircle size={16} />
                      Pedir via WhatsApp 💬
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
        <div className="max-w-sm mx-auto">
          <button
            onClick={() => openWhatsApp(`Olá! Vi a ${partner.business_name} no EscolheAí 😄`, "partner_page")}
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