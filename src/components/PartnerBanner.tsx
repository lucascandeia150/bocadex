import { MessageCircle, Flame, ArrowRight, Store as StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

interface FeaturedPartner {
  id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  whatsapp: string;
  logo_url: string | null;
  promotions: string | null;
  uses_app_courier: boolean;
}

export function PartnerBanner() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<FeaturedPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partner_applications")
        .select("id, business_name, business_type, description, whatsapp, logo_url, promotions, uses_app_courier")
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: true })
        .limit(3);
      setPartners((data ?? []) as FeaturedPartner[]);
      setLoading(false);
    })();
  }, []);

  const openWhatsApp = (e: React.MouseEvent, p: FeaturedPartner) => {
    e.stopPropagation();
    trackEvent("click_partner_whatsapp", { partner: p.business_name, source: "partner_banner" });
    trackAnalyticsEvent("partner_click", { partner_name: p.business_name, source: "partner_banner" });
    trackAnalyticsEvent("whatsapp_click", { source: "partner_banner" });
    const phone = (p.whatsapp || "").replace(/\D/g, "");
    const msg = `Olá! Vi a ${p.business_name} no EscolheAí 😄`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="w-full max-w-sm mx-auto rounded-2xl bg-muted h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (partners.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {partners.map((p) => (
        <div
          key={p.id}
          className="w-full max-w-sm mx-auto rounded-2xl border-2 border-secondary/40 bg-card shadow-lg overflow-hidden animate-slide-up"
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
              {p.logo_url ? (
                <img
                  src={p.logo_url}
                  alt={p.business_name}
                  loading="lazy"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-2xl shadow-md border-2 border-secondary/30 object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <StoreIcon size={24} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-foreground">{p.business_name}</h3>
                {p.business_type && (
                  <p className="text-xs text-muted-foreground mt-0.5">{p.business_type}</p>
                )}
                {p.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
                )}
              </div>
            </div>

            {p.promotions && (
              <div className="mt-3 bg-secondary/15 border border-secondary/30 rounded-xl p-3 text-center">
                <p className="text-sm font-black text-secondary flex items-center justify-center gap-1">
                  <Flame size={16} /> {p.promotions} <Flame size={16} />
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-3">
              <button
                onClick={() => navigate(`/parceiro/${p.id}`)}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 text-sm"
              >
                🏪 Ver loja completa <ArrowRight size={14} />
              </button>
              <button
                onClick={(e) => openWhatsApp(e, p)}
                className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 text-sm shadow-md"
              >
                <MessageCircle size={16} /> Falar com a loja 💬
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
