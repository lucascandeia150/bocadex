import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, ShoppingBag, Store as StoreIcon, Plus, Star, Clock, Link2, Share2, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { ProductOrderModal } from "@/components/ProductOrderModal";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface Partner {
  id: string;
  slug: string | null;
  business_name: string;
  business_type: string;
  address: string;
  description: string;
  whatsapp: string;
  promotions: string | null;
  logo_url: string | null;
  banner_url: string | null;
  uses_app_courier: boolean;
  is_demo?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  partner_category_id: string | null;
  is_featured: boolean;
  original_price: number | null;
  display_order: number;
}

interface Category {
  id: string; name: string; icon: string; image_url: string | null; display_order: number;
}

export default function ParceiroDetalhePage() {
  const params = useParams<{ id?: string; slug?: string }>();
  const key = (params.slug || params.id || "").trim();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const { totalItems, totalValue, partnerId: cartPartnerId } = useCart();
  const cartHasThisStore = cartPartnerId === partner?.id && totalItems > 0;
  const isProductModalOpen = !!orderProduct;

  useEffect(() => {
    scrollContainerRef.current = document.querySelector("main");
  }, []);

  useEffect(() => {
    if (!key) { setLoading(false); return; }
    setLoading(true);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
    (async () => {
      const q = supabase.from("partner_applications")
        .select("id, slug, business_name, business_type, address, description, whatsapp, promotions, logo_url, banner_url, uses_app_courier, is_demo, status, is_active, visibility");
      const { data: partnerRow } = isUuid ? await q.eq("id", key).maybeSingle() : await q.eq("slug", key).maybeSingle();
      if (!partnerRow) { setLoading(false); return; }
      if (isUuid && partnerRow.slug) { navigate(`/${partnerRow.slug}`, { replace: true }); return; }
      if (partnerRow.status !== "approved" || partnerRow.is_active === false) { setLoading(false); return; }
      setPartner(partnerRow as Partner);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products")
          .select("id, name, description, image_url, price_min, price_max, partner_category_id, is_featured, original_price, display_order")
          .eq("partner_id", partnerRow.id).eq("is_active", true)
          .order("display_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("partner_categories")
          .select("id, name, icon, image_url, display_order")
          .eq("partner_id", partnerRow.id).eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);
      setProducts((prods as Product[]) || []);
      setCategories((cats as Category[]) || []);
      setLoading(false);
    })();
  }, [key, navigate]);

  // Sections derivation
  const featured = useMemo(() => products.filter(p => p.is_featured), [products]);
  const promos = useMemo(() => products.filter(p => p.original_price != null && p.price_min != null && p.original_price > p.price_min), [products]);
  const byCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const k = p.partner_category_id || "__uncat__";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    }
    return map;
  }, [products]);

  const visibleCategories = useMemo(
    () => categories.filter(c => (byCategory.get(c.id)?.length || 0) > 0),
    [categories, byCategory]
  );
  const uncategorized = byCategory.get("__uncat__") || [];

  const sections = useMemo(() => {
    const arr: { id: string; label: string }[] = [];
    if (featured.length) arr.push({ id: "destaques", label: "⭐ Destaques" });
    if (promos.length) arr.push({ id: "promocoes", label: "🔥 Promoções" });
    visibleCategories.forEach(c => arr.push({ id: `cat-${c.id}`, label: `${c.icon} ${c.name}` }));
    if (uncategorized.length) arr.push({ id: "outros", label: "📋 Outros" });
    return arr;
  }, [featured, promos, visibleCategories, uncategorized]);

  // IntersectionObserver to track active section
  useEffect(() => {
    if (!sections.length) return;
    const container = scrollContainerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { root: container, rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(s => {
      const el = sectionRefs.current[s.id];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  // Auto-scroll active chip into view
  useEffect(() => {
    if (!activeSection || !navRef.current) return;
    const chip = navRef.current.querySelector(`[data-chip="${activeSection}"]`) as HTMLElement | null;
    if (chip) chip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSection]);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    const containerTop = container.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const offset = elTop - containerTop + container.scrollTop - 120;
    container.scrollTo({ top: offset, behavior: "smooth" });
  };

  const shareUrl = partner ? `${window.location.origin}/${partner.slug || partner.id}` : "";
  const copyLink = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); toast.success("Link copiado!"); trackAnalyticsEvent("partner_share_copy", { partner_id: partner?.id }); }
    catch { toast.error("Não foi possível copiar"); }
  };
  const shareLink = async () => {
    if (!shareUrl || !partner) return;
    if (navigator.share) {
      try { await navigator.share({ title: partner.business_name, url: shareUrl }); }
      catch { /* */ }
    } else copyLink();
  };
  const openWhatsApp = (msg: string, source: string) => {
    if (!partner) return;
    trackAnalyticsEvent("partner_click", { partner_name: partner.business_name, source });
    const phone = partner.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="pb-28">
        <div className="h-44 bg-muted animate-pulse" />
        <div className="px-4 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-muted animate-pulse border-4 border-background" />
          <div className="h-5 bg-muted rounded mt-4 w-2/3 animate-pulse" />
          <div className="space-y-3 mt-6">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl bg-muted h-28 animate-pulse" />)}
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
        <button onClick={() => navigate("/lojas")} className="mt-4 text-primary font-semibold text-sm">← Voltar</button>
      </div>
    );
  }

  return (
    <div className="pb-44">
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        {partner.banner_url ? (
          <img src={partner.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager"/>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,71%,45%)] via-[hsl(142,71%,38%)] to-[hsl(24,95%,48%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white no-blur shadow-lg flex items-center justify-center active:scale-90 z-10" aria-label="Voltar">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      {/* Cabeçalho da loja */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.business_name} loading="lazy"
              className="w-24 h-24 rounded-2xl shadow-xl border-4 border-background object-cover bg-card shrink-0"/>
          ) : (
            <div className="w-24 h-24 rounded-2xl shadow-xl border-4 border-background bg-card flex items-center justify-center shrink-0">
              <StoreIcon size={36} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 pb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-[hsl(142,70%,45%)] text-white px-2 py-0.5 rounded-full uppercase">
              <Clock size={9}/> Aberto
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-foreground mt-3 leading-tight">{partner.business_name}</h1>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {partner.business_type && <span className="text-xs font-bold text-muted-foreground">{partner.business_type}</span>}
          <span className="flex items-center gap-1 text-xs font-bold text-foreground">
            <Star size={12} className="fill-secondary text-secondary"/> Novo
          </span>
        </div>
        {partner.description && <p className="text-sm text-muted-foreground mt-2 leading-snug">{partner.description}</p>}
        {partner.address && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <MapPin size={12} className="text-primary shrink-0"/> {partner.address}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-muted text-foreground px-3 py-2 rounded-xl active:scale-95">
            <Link2 size={13}/> Copiar link
          </button>
          <button onClick={shareLink} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-2 rounded-xl active:scale-95">
            <Share2 size={13}/> Compartilhar
          </button>
        </div>
      </div>

      {/* Menu sticky de categorias */}
      {sections.length > 0 && (
        <div className="sticky top-0 z-30 bg-background no-blur border-b border-border mt-5">
          <div ref={navRef} className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
            {sections.map(s => {
              const active = activeSection === s.id;
              return (
                <button key={s.id} data-chip={s.id} onClick={() => scrollTo(s.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${active ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 space-y-6 mt-4">
        {partner.is_demo && (
          <div className="rounded-2xl border-2 border-orange-500/50 bg-orange-500/10 p-3 flex items-start gap-2">
            <span className="text-lg">🧪</span>
            <div className="flex-1">
              <p className="text-xs font-black text-orange-700 uppercase">Modo demonstração</p>
              <p className="text-[11px] text-foreground/80 mt-0.5">Esta loja é apenas para apresentação.</p>
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <ShoppingBag size={28} className="mx-auto text-muted-foreground mb-2"/>
            <p className="text-sm text-foreground font-semibold">Catálogo sob consulta</p>
            <p className="text-xs text-muted-foreground mt-1">Fale com a loja pelo WhatsApp para ver o cardápio.</p>
          </div>
        )}

        {/* Destaques — carrossel */}
        {featured.length > 0 && (
          <section id="destaques" ref={el => (sectionRefs.current["destaques"] = el)}>
            <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
              <Star size={16} className="fill-secondary text-secondary"/> Destaques
            </h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-none">
              {featured.map(p => (
                <FeaturedCard key={p.id} p={p} onAdd={() => setOrderProduct(p)} />
              ))}
            </div>
          </section>
        )}

        {/* Promoções */}
        {promos.length > 0 && (
          <section id="promocoes" ref={el => (sectionRefs.current["promocoes"] = el)}>
            <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
              <Flame size={16} className="text-destructive"/> Promoções
            </h2>
            <div className="flex flex-col gap-3">
              {promos.map(p => <ProductRow key={p.id} p={p} onAdd={() => setOrderProduct(p)} />)}
            </div>
          </section>
        )}

        {/* Categorias */}
        {visibleCategories.map(c => {
          const items = byCategory.get(c.id) || [];
          return (
            <section key={c.id} id={`cat-${c.id}`} ref={el => (sectionRefs.current[`cat-${c.id}`] = el)}>
              <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">{c.icon}</span> {c.name}
                <span className="text-[10px] font-bold text-muted-foreground">({items.length})</span>
              </h2>
              <div className="flex flex-col gap-3">
                {items.map(p => <ProductRow key={p.id} p={p} onAdd={() => setOrderProduct(p)} />)}
              </div>
            </section>
          );
        })}

        {uncategorized.length > 0 && (
          <section id="outros" ref={el => (sectionRefs.current["outros"] = el)}>
            <h2 className="text-base font-black text-foreground mb-3 flex items-center gap-2">📋 Outros</h2>
            <div className="flex flex-col gap-3">
              {uncategorized.map(p => <ProductRow key={p.id} p={p} onAdd={() => setOrderProduct(p)} />)}
            </div>
          </section>
        )}
      </div>

      {/* CTA fixa */}
      <div className={`fixed left-0 right-0 z-30 px-4 pt-3 bg-background no-blur border-t border-border transition-transform duration-200 ${isProductModalOpen ? "translate-y-full pointer-events-none" : "translate-y-0"}`}
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="max-w-sm mx-auto">
          {cartHasThisStore ? (
            <button onClick={() => navigate("/carrinho")}
              className="w-full bg-[hsl(142,70%,45%)] text-white font-black py-3.5 rounded-2xl active:scale-[0.98] flex items-center justify-between gap-2 px-5 text-sm shadow-lg">
              <span className="flex items-center gap-2">
                <span className="bg-white/25 text-white text-[11px] font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">{totalItems}</span>
                Ver carrinho
              </span>
              <span className="font-black">R${totalValue.toFixed(2)}</span>
            </button>
          ) : (
            <button onClick={() => openWhatsApp(`Olá! Vi a ${partner.business_name} no Bocadex Delivery's 😄`, "partner_page")}
              className="w-full bg-card border-2 border-[hsl(142,70%,45%)] text-[hsl(142,70%,38%)] font-black py-3.5 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-lg">
              <MessageCircle size={18}/> Falar com a loja
            </button>
          )}
        </div>
      </div>

      {orderProduct && (
        <ProductOrderModal
          open={!!orderProduct} onClose={() => setOrderProduct(null)}
          partnerId={partner.id} storeName={partner.business_name} whatsapp={partner.whatsapp}
          productName={orderProduct.name} productId={orderProduct.id}
          unitPrice={orderProduct.price_min} hasDelivery={partner.uses_app_courier}
          onSent={() => trackAnalyticsEvent("partner_click", { partner_name: partner.business_name, source: "add_to_cart" })}
        />
      )}
    </div>
  );
}

function priceLabel(p: Product) {
  if (p.price_min == null) return "Sob consulta";
  if (p.price_max != null && p.price_max !== p.price_min) {
    return `R$${Number(p.price_min).toFixed(2)} – R$${Number(p.price_max).toFixed(2)}`;
  }
  return `R$${Number(p.price_min).toFixed(2)}`;
}
function isPromo(p: Product) {
  return p.original_price != null && p.price_min != null && p.original_price > p.price_min;
}

function FeaturedCard({ p, onAdd }: { p: Product; onAdd: () => void }) {
  const promo = isPromo(p);
  return (
    <article className="snap-start shrink-0 w-56 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-[hsl(142,60%,55%)] to-[hsl(24,90%,55%)]">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover"/>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</div>
        )}
        <span className="absolute top-2 left-2 text-[9px] font-black bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">⭐ DESTAQUE</span>
        {promo && <span className="absolute top-2 right-2 text-[9px] font-black bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">🔥 PROMO</span>}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-black text-foreground line-clamp-1">{p.name}</h3>
        {p.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <div className="min-w-0">
            {promo && <p className="text-[10px] line-through text-muted-foreground">R${Number(p.original_price).toFixed(2)}</p>}
            <p className="text-sm font-black text-primary">{priceLabel(p)}</p>
          </div>
          <button onClick={onAdd} aria-label={`Adicionar ${p.name}`}
            className="w-8 h-8 rounded-full bg-[hsl(142,70%,45%)] text-white flex items-center justify-center shadow active:scale-90">
            <Plus 
