import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Store as StoreIcon, Zap, Plus, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CardParceiro } from "@/components/CardParceiro";
import { ProductOrderModal } from "@/components/ProductOrderModal";

interface Partner {
  id: string;
  business_name: string;
  business_type: string | null;
  description: string;
  logo_url: string | null;
  whatsapp: string;
  promotions: string | null;
  uses_app_courier: boolean;
  is_featured?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  partner_id: string | null;
}

type ProductWithPartner = Product & { partner: Partner | null };

function priceLabel(p: Product) {
  if (p.price_min && p.price_max && p.price_min !== p.price_max)
    return `R$${Number(p.price_min).toFixed(2)} – R$${Number(p.price_max).toFixed(2)}`;
  if (p.price_min) return `R$${Number(p.price_min).toFixed(2)}`;
  return "Consulte";
}

// Gradiente placeholder consistente baseado no id do produto
const PLACEHOLDER_GRADIENTS = [
  "from-[hsl(142,70%,55%)] to-[hsl(142,70%,40%)]",
  "from-[hsl(24,95%,60%)] to-[hsl(24,95%,48%)]",
  "from-[hsl(142,60%,60%)] to-[hsl(180,60%,45%)]",
  "from-[hsl(24,90%,60%)] to-[hsl(0,80%,55%)]",
  "from-[hsl(45,90%,60%)] to-[hsl(24,95%,53%)]",
  "from-[hsl(160,60%,50%)] to-[hsl(142,70%,40%)]",
];
function gradientFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_GRADIENTS[h % PLACEHOLDER_GRADIENTS.length];
}
function emojiFor(p: { name: string; description?: string }) {
  const text = `${p.name} ${p.description || ""}`.toLowerCase();
  if (/pizz/.test(text)) return "🍕";
  if (/burg|hamb|x-/.test(text)) return "🍔";
  if (/sush|jap|temaki/.test(text)) return "🍣";
  if (/açaí|acai|sorvete|gelado/.test(text)) return "🍧";
  if (/bebid|cerveja|drink|suco|refri|caip/.test(text)) return "🥤";
  if (/doce|bolo|brigad|torta|sobremesa/.test(text)) return "🍰";
  if (/salgad|coxinh|past|esfih/.test(text)) return "🥟";
  if (/marmit|prato|comida|almoço|jantar/.test(text)) return "🍱";
  if (/café|cafe|capp/.test(text)) return "☕";
  return "🍽️";
}

export function HomeConversion() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<ProductWithPartner[]>([]);
  const [order, setOrder] = useState<ProductWithPartner | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: pData } = await supabase
        .from("partner_applications")
        .select("id,business_name,business_type,description,logo_url,whatsapp,promotions,uses_app_courier,is_featured")
        .eq("status", "approved")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .limit(20);

      const { data: prodData } = await supabase
        .from("products")
        .select("id,name,description,image_url,price_min,price_max,partner_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!active) return;
      const partnersList = (pData as Partner[]) || [];
      setPartners(partnersList);

      const partnerMap = new Map(partnersList.map((p) => [p.id, p]));
      const enriched: ProductWithPartner[] = ((prodData as Product[]) || []).map((p) => ({
        ...p,
        partner: p.partner_id ? partnerMap.get(p.partner_id) ?? null : null,
      })).filter((p) => p.partner); // só produtos de parceiros aprovados
      setProducts(enriched);
    })();
    return () => { active = false; };
  }, []);

  // Promoções: produtos cujo parceiro tem promotion preenchida, ou nome/desc contém "promo"
  const promos = products.filter(
    (p) =>
      (p.partner?.promotions && p.partner.promotions.trim().length > 0) ||
      /promo|oferta|desconto/i.test(`${p.name} ${p.description}`)
  ).slice(0, 6);

  // Pedidos rápidos: produtos mais recentes (já vêm ordenados)
  const quick = products.slice(0, 8);

  if (partners.length === 0 && products.length === 0) return null;

  return (
    <div className="w-full max-w-md space-y-6 mb-8 relative z-10">
      {/* PROMOÇÕES */}
      {promos.length > 0 && (
        <section className="animate-slide-up">
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Flame size={18} className="text-secondary" />
              Promoções do dia
            </h2>
          </header>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {promos.map((p) => (
              <article
                key={p.id}
                className="snap-start shrink-0 w-44 bg-card rounded-2xl border border-secondary/30 shadow-md overflow-hidden flex flex-col"
              >
                <button
                  onClick={() => p.partner && navigate(`/loja/${p.partner.id}`)}
                  className="aspect-square bg-muted relative"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🔥</div>
                  )}
                  <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Promo
                  </span>
                </button>
                <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                  <h3 className="text-xs font-black text-foreground line-clamp-2 leading-tight">{p.name}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{p.partner?.business_name}</p>
                  <p className="text-sm font-black text-primary mt-auto">{priceLabel(p)}</p>
                  <button
                    onClick={() => setOrder(p)}
                    className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white text-[11px] font-black rounded-lg py-1.5 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <ShoppingCart size={12} /> Pedir
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* LOJAS ABERTAS */}
      {partners.length > 0 && (
        <section className="animate-slide-up">
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <StoreIcon size={18} className="text-primary" />
              Lojas abertas
            </h2>
            <button
              onClick={() => navigate("/lojas")}
              className="text-[11px] font-bold text-primary flex items-center"
            >
              Ver todas <ChevronRight size={12} />
            </button>
          </header>
          <div className="space-y-2">
            {partners.slice(0, 4).map((p, i) => (
              <CardParceiro
                key={p.id}
                index={i}
                partner={{
                  id: p.id,
                  business_name: p.business_name,
                  description: p.description,
                  logo_url: p.logo_url,
                  business_type: p.business_type,
                  offer: p.promotions,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* PEDIDOS RÁPIDOS */}
      {quick.length > 0 && (
        <section className="animate-slide-up">
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Zap size={18} className="text-accent-foreground" />
              Pedidos rápidos
            </h2>
          </header>
          <div className="grid grid-cols-2 gap-3">
            {quick.map((p) => (
              <article
                key={p.id}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col"
              >
                <button
                  onClick={() => p.partner && navigate(`/loja/${p.partner.id}`)}
                  className="aspect-square bg-muted"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </button>
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <h3 className="text-xs font-black text-foreground line-clamp-1">{p.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{p.partner?.business_name}</p>
                  <p className="text-xs font-black text-primary">{priceLabel(p)}</p>
                  <button
                    onClick={() => setOrder(p)}
                    className="mt-1 w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white text-[10px] font-black rounded-lg py-1.5 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <ShoppingCart size={11} /> Pedir agora
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {order && order.partner && (
        <ProductOrderModal
          open={!!order}
          onClose={() => setOrder(null)}
          partnerId={order.partner.id}
          storeName={order.partner.business_name}
          whatsapp={order.partner.whatsapp}
          productName={order.name}
          productId={order.id}
          unitPrice={order.price_min}
          hasDelivery={order.partner.uses_app_courier}
          onSent={() => setOrder(null)}
        />
      )}
    </div>
  );
}