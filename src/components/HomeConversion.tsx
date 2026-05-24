import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Store as StoreIcon, Plus, ChevronRight, Star, TrendingUp, Clock, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  is_demo?: boolean;
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

// Skeleton components
function ProductSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/4 mt-1" />
      </div>
    </div>
  );
}

function StoreSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-3 flex items-center gap-3 animate-pulse w-full">
      <div className="w-14 h-14 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-2 bg-muted rounded w-1/3" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

function StoreCard({ p, onClick }: { p: Partner; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-card rounded-2xl border border-border/60 p-3 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-sm hover:shadow-md w-full"
    >
      <div className="w-14 h-14 rounded-xl bg-[hsl(142,50%,96%)] flex items-center justify-center overflow-hidden shrink-0">
        {p.logo_url ? (
          <img
            src={p.logo_url}
            alt={p.business_name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={56}
            height={56}
          />
        ) : (
          <StoreIcon size={22} className="text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-black text-foreground truncate">{p.business_name}</h3>
        <p className="text-[11px] text-muted-foreground truncate">{p.business_type || "Loja parceira"}</p>
        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-muted-foreground">
          <span className="flex items-center gap-0.5"><Star size={10} className="fill-secondary text-secondary" /> 4.8</span>
          <span className="flex items-center gap-0.5"><Clock size={10} /> 30–45 min</span>
          {p.uses_app_courier && <span className="flex items-center gap-0.5 text-primary"><Bike size={10} /> Entrega</span>}
        </div>
      </div>
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </button>
  );
}

function ProductCard({ p, onAdd, onOpen, badge }: {
  p: ProductWithPartner;
  onAdd: () => void;
  onOpen: () => void;
  badge?: { label: string; tone: "promo" | "new" };
}) {
  return (
    <article className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col">
      <button onClick={onOpen} className="relative aspect-[4/3] overflow-hidden bg-[hsl(142,50%,96%)]">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            decoding="async"
            width={400}
            height={300}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{emojiFor(p)}</div>
        )}
        {badge && (
          <span className={`absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm ${
            badge.tone === "promo"
              ? "bg-[hsl(24,95%,53%)] text-white"
              : "bg-white/95 text-foreground"
          }`}>
            {badge.label}
          </span>
        )}
      </button>
      <div className="p-3 flex flex-col gap-0.5 flex-1">
        <h3 className="text-sm font-extrabold text-foreground line-clamp-1 leading-tight">{p.name}</h3>
        <p className="text-[10px] text-muted-foreground truncate">{p.partner?.business_name}</p>
        <div className="flex items-end justify-between mt-1.5 gap-2">
          <p className="text-sm font-black text-primary leading-none">{priceLabel(p)}</p>
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform shadow-md shrink-0"
            aria-label={`Adicionar ${p.name}`}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function HomeConversion() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [products, setProducts] = useState<ProductWithPartner[]>([]);
  const [order, setOrder] = useState<ProductWithPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: pData, error: pError } = await supabase
          .from("partner_applications")
          .select("id,slug,business_name,business_type,description,logo_url,whatsapp,promotions,uses_app_courier,is_featured,is_demo")
          .eq("status", "approved")
          .eq("is_active", true)
          .eq("is_demo", false)
          .order("is_featured", { ascending: false })
          .limit(20);

        if (pError) {
          console.error("[HomeConversion] Erro ao buscar parceiros:", pError);
        }

        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("id,name,description,image_url,price_min,price_max,partner_id")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(30);

        if (prodError) {
          console.error("[HomeConversion] Erro ao buscar produtos:", prodError);
        }

        if (!active) return;

        const seenIds = new Set<string>();
        const seenNames = new Set<string>();
        const partnersList = ((pData as Partner[]) || []).filter((p) => {
          const key = (p.business_name || "").trim().toLowerCase();
          if (seenIds.has(p.id) || seenNames.has(key)) return false;
          seenIds.add(p.id);
          seenNames.add(key);
          return true;
        });

        console.log("[HomeConversion] Parceiros carregados:", partnersList.length);
        console.log("[HomeConversion] Produtos carregados:", (prodData || []).length);

        setPartners(partnersList);

        const partnerMap = new Map(partnersList.map((p) => [p.id, p]));
        const seen = new Set<string>();
        const enriched: ProductWithPartner[] = ((prodData as Product[]) || [])
          .map((p) => ({ ...p, partner: p.partner_id ? partnerMap.get(p.partner_id) ?? null : null }))
          .filter((p) => {
            if (!p.partner || seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });

        console.log("[HomeConversion] Produtos com parceiro:", enriched.length);
        setProducts(enriched);

      } catch (err) {
        console.error("[HomeConversion] Erro inesperado:", err);
        setError("Erro ao carregar dados. Tente novamente.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => { active = false; };
  }, []);

  const promos = products.filter(
    (p) =>
      (p.partner?.promotions && p.partner.promotions.trim().length > 0) ||
      /promo|oferta|desconto/i.test(`${p.name} ${p.description}`)
  ).slice(0, 6);

  const promoIds = new Set(promos.map((p) => p.id));
  const trending = products.filter((p) => !promoIds.has(p.id)).slice(0, 6);
  const featured = partners.filter((p) => p.is_featured).slice(0, 5);
  const featuredIds = new Set(featured.map((p) => p.id));
  const open = partners.filter((p) => !featuredIds.has(p.id)).slice(0, 6);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-md space-y-7 mb-8">
        <div className="rounded-2xl overflow-hidden bg-muted animate-pulse h-24" />
        <section>
          <div className="h-4 bg-muted rounded w-40 mb-3 animate-pulse" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-44">
                <ProductSkeleton />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="h-4 bg-muted rounded w-32 mb-3 animate-pulse" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => <StoreSkeleton key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-md mb-8 p-6 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-primary text-sm font-bold underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Empty state — mostra algo em vez de sumir
  if (partners.length === 0 && products.length === 0) {
    return (
      <div className="w-full max-w-md mb-8">
        {/* Banner parceiros sempre aparece */}
        <a
          href="/seja-parceiro"
          className="block rounded-2xl overflow-hidden shadow-md active:scale-[0.99] transition-transform mb-6"
        >
          <div className="bg-primary p-4 text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-7xl opacity-15">🛵</div>
            <div className="relative">
              <p className="text-[11px] font-bold uppercase opacity-90 tracking-wide">Bocadex Delivery's Parceiros</p>
              <p className="text-base font-black leading-tight mt-1">
                Sua loja no Bocadex Delivery's por R$ 9,90/mês
              </p>
              <span className="inline-flex items-center gap-1 mt-2.5 bg-white text-primary text-xs font-black px-3 py-1.5 rounded-full">
                Quero ser parceiro <ChevronRight size={12} />
              </span>
            </div>
          </div>
        </a>
        <div className="text-center py-8">
          <StoreIcon size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm font-medium">Nenhuma loja disponível no momento</p>
          <p className="text-muted-foreground text-xs mt-1">Volte em breve para novidades!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-7 mb-8 relative z-10">
      {/* BANNER PROMOCIONAL */}
      <a
        href="/seja-parceiro"
        className="block rounded-2xl overflow-hidden shadow-md active:scale-[0.99] transition-transform"
      >
        <div className="bg-primary p-4 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-7xl opacity-15">🛵</div>
          <div className="relative">
            <p className="text-[11px] font-bold uppercase opacity-90 tracking-wide">Bocadex Delivery's Parceiros</p>
            <p className="text-base font-black leading-tight mt-1">
              Sua loja no Bocadex Delivery's por R$ 9,90/mês
            </p>
            <span className="inline-flex items-center gap-1 mt-2.5 bg-white text-primary text-xs font-black px-3 py-1.5 rounded-full">
              Quero ser parceiro <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </a>

      {/* MAIS PEDIDOS HOJE */}
      {trending.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <TrendingUp size={16} className="text-primary" /> Mais pedidos hoje
            </h2>
          </header>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide">
            {trending.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-44">
                <ProductCard
                  p={p}
                  badge={{ label: "🔥 Em alta", tone: "new" }}
                  onAdd={() => setOrder(p)}
                  onOpen={() => p.partner && navigate(`/loja/${p.partner.id}`)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PROMOÇÕES DO DIA */}
      {promos.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <Flame size={16} className="text-[hsl(24,95%,53%)]" /> Promoções do dia
            </h2>
          </header>
          <div className="grid grid-cols-2 gap-3">
            {promos.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                badge={{ label: "Promo", tone: "promo" }}
                onAdd={() => setOrder(p)}
                onOpen={() => p.partner && navigate(`/loja/${p.partner.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* LOJAS EM DESTAQUE */}
      {featured.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <Star size={16} className="fill-secondary text-secondary" /> Lojas em destaque
            </h2>
          </header>
          <div className="space-y-2.5">
            {featured.map((p) => (
              <StoreCard key={p.id} p={p} onClick={() => navigate(`/loja/${p.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* LOJAS ABERTAS */}
      {open.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <StoreIcon size={16} className="text-primary" /> Lojas abertas
            </h2>
            <button
              onClick={() => navigate("/lojas")}
              className="text-[11px] font-bold text-primary flex items-center"
            >
              Ver todas <ChevronRight size={12} />
            </button>
          </header>
          <div className="space-y-2.5">
            {open.map((p) => (
              <StoreCard key={p.id} p={p} onClick={() => navigate(`/loja/${p.id}`)} />
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
