import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Package, Bike, AlertTriangle, Zap, CreditCard, LogIn, MapPin, Loader2, Ticket, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { useMapboxToken } from "@/hooks/useMapboxToken";

type Mode = "retirar" | "entrega";

export default function CarrinhoPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const {
    items,
    partnerId,
    partnerName,
    partnerWhatsapp,
    partnerHasDelivery,
    totalItems,
    totalValue,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [mode, setMode] = useState<Mode>(partnerHasDelivery ? "entrega" : "retirar");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [payingMp, setPayingMp] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address: string; is_default: boolean }[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ id: string; code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<{ id: string; code: string; description: string; type: string; value: number; min_order: number }[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [feeSource, setFeeSource] = useState<string>("");
  const [feeZoneName, setFeeZoneName] = useState<string>("");
  const [loadingFee, setLoadingFee] = useState(false);
  const [feeDistance, setFeeDistance] = useState<number | null>(null);
  const [feeAvailable, setFeeAvailable] = useState<boolean>(true);
  const { token: mapboxToken } = useMapboxToken();

  const includeDelivery = mode === "entrega" && partnerHasDelivery;
  const subtotalAfterCoupon = Math.max(totalValue - (couponApplied?.discount ?? 0), 0);
  const finalValue = subtotalAfterCoupon + (includeDelivery ? deliveryFee : 0);

  // Resolve taxa de entrega em tempo real (com geocodificação para distância real)
  useEffect(() => {
    if (!includeDelivery || !partnerId) {
      setDeliveryFee(0); setFeeSource(""); setFeeZoneName("");
      setFeeDistance(null); setFeeAvailable(true);
      return;
    }
    let cancel = false;
    setLoadingFee(true);
    const t = setTimeout(async () => {
      // Geocodifica endereço quando há texto suficiente e token disponível
      let lat: number | null = null;
      let lng: number | null = null;
      if (mapboxToken && address && address.trim().length > 6) {
        try {
          const r = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&country=br&limit=1`
          );
          const j = await r.json();
          const c = j?.features?.[0]?.center;
          if (Array.isArray(c) && c.length === 2) { lng = c[0]; lat = c[1]; }
        } catch { /* ignore — cai no fallback por keyword */ }
      }
      if (cancel) return;
      const { data, error } = await supabase.rpc("resolve_delivery_fee", {
        _partner_id: partnerId,
        _address: address || "",
        _dest_lat: lat,
        _dest_lng: lng,
        _subtotal: subtotalAfterCoupon,
      });
      if (cancel) return;
      setLoadingFee(false);
      const row = (data as Array<{ fee: number; source: string; zone_name: string; distance_km: number | null; available: boolean }> | null)?.[0];
      if (error || !row) return;
      setDeliveryFee(Number(row.fee || 0));
      setFeeSource(row.source);
      setFeeZoneName(row.zone_name || "");
      setFeeDistance(row.distance_km != null ? Number(row.distance_km) : null);
      setFeeAvailable(row.available !== false);
    }, 350);
    return () => { cancel = true; clearTimeout(t); };
  }, [partnerId, address, includeDelivery, mapboxToken, subtotalAfterCoupon]);

  const applyCouponCode = async (code: string) => {
    if (!code.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        _code: code.trim(),
        _order_value: totalValue,
        _partner_id: partnerId,
      });
      const row = (data as Array<{ id: string; code: string; ok: boolean; message: string; discount: number }> | null)?.[0];
      if (error) { console.error(error); toast.error("Erro ao validar cupom. Tente novamente."); return; }
      if (!row) { toast.error("❌ Cupom inválido"); return; }
      if (!row.ok) { toast.error(`❌ ${row.message || "Cupom inválido"}`); return; }
      setCouponApplied({ id: row.id, code: row.code, discount: Number(row.discount) });
      setCouponCode("");
      toast.success(`✅ Cupom ${row.code} aplicado! -R$ ${Number(row.discount).toFixed(2)}`);
    } finally {
      setValidatingCoupon(false);
    }
  };
  const applyCoupon = () => applyCouponCode(couponCode);

  // Carrega cupons disponíveis (públicos ou da loja)
  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("coupons")
        .select("id, code, description, type, value, min_order, partner_id, expires_at")
        .eq("active", true)
        .or(`partner_id.is.null,partner_id.eq.${partnerId ?? "00000000-0000-0000-0000-000000000000"}`)
        .limit(20);
      if (cancel || !data) return;
      const now = Date.now();
      const valid = data
        .filter((c) => !c.expires_at || new Date(c.expires_at).getTime() > now)
        .map((c) => ({ id: c.id, code: c.code, description: c.description || "", type: c.type, value: Number(c.value), min_order: Number(c.min_order || 0) }));
      setAvailableCoupons(valid);
    })();
    return () => { cancel = true; };
  }, [partnerId]);

  // Pré-preenche dados do perfil logado
  useEffect(() => {
    if (profile) {
      if (!name && profile.name) setName(profile.name);
      if (!phone && profile.phone) setPhone(profile.phone);
    }
  }, [profile]);

  // Carrega endereços salvos e seleciona o padrão
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_addresses")
      .select("id, label, address, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setSavedAddresses(data);
        const def = data.find((a) => a.is_default) || data[0];
        if (def && !address) setAddress(def.address);
      });
  }, [user]);

  // Validação derivada
  const validation = (() => {
    if (!name.trim()) return "Informe seu nome";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) return "Informe um telefone válido";
    if (mode === "entrega" && partnerHasDelivery && !address.trim()) return "Informe o endereço de entrega";
    if (mode === "entrega" && partnerHasDelivery && !feeAvailable) return "Endereço fora da área de entrega desta loja";
    if (totalValue <= 0) return "Carrinho sem valor";
    return null;
  })();

  const buildOrderDescription = () =>
    items
      .map((i) => `• ${i.name} (x${i.quantity})${i.notes ? ` — ${i.notes}` : ""}`)
      .join("\n");

  const buildWaMessage = (extra?: string) => {
    const lines = [
      `Olá, ${partnerName}! 👋`,
      ``,
      `Pedido pelo Bocadex Delivery's:`,
      buildOrderDescription(),
      ``,
      `💰 Total: R$${totalValue.toFixed(2)}`,
      `📦 Tipo: ${mode === "retirar" ? "Retirar na loja" : "Entrega"}`,
    ];
    if (name.trim()) lines.push(`👤 Nome: ${name.trim()}`);
    if (phone.trim()) lines.push(`📞 Telefone: ${phone.trim()}`);
    if (mode === "entrega" && address.trim()) lines.push(`📍 Endereço: ${address.trim()}`);
    if (extra) lines.push(``, extra);
    lines.push(``, `Pode confirmar? 😄`);
    return lines.join("\n");
  };

  const openWa = (msg: string) => {
    if (!partnerWhatsapp) return;
    const phone = partnerWhatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendWhatsAppOnly = () => {
    openWa(buildWaMessage());
    trackAnalyticsEvent("partner_click", { partner_name: partnerName ?? "", source: "cart_whatsapp" });
    trackAnalyticsEvent("whatsapp_click", { source: "cart_whatsapp" });
    toast.success("Pedido enviado para a loja!");
    clear();
    navigate(-1);
  };

  const confirmOrder = async () => {
    if (!partnerId) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/carrinho")}`);
      return;
    }
    if (mode === "entrega") {
      if (!partnerHasDelivery) {
        toast.error("Esta loja não trabalha com entrega via app");
        return;
      }
      if (!address.trim()) {
        toast.error("Informe o endereço de entrega");
        return;
      }
    }

    if (mode === "retirar" || !partnerHasDelivery) {
      // sem entregador do app — envia direto pra loja via WhatsApp
      sendWhatsAppOnly();
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.rpc("customer_create_delivery", {
      _partner_id: partnerId,
      _order_description: buildOrderDescription(),
      _delivery_address: address.trim(),
      _customer_name: name.trim() || "Cliente",
      _customer_phone: phone.trim(),
      _order_value: totalValue,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Não foi possível criar o pedido");
      return;
    }

    // Salva ID do pedido localmente para mostrar no histórico
    try {
      const newId = (data as { id?: string } | null)?.id;
      if (newId) {
        const raw = localStorage.getItem("escolheai_order_ids");
        const ids: string[] = raw ? JSON.parse(raw) : [];
        ids.unshift(newId);
        localStorage.setItem("escolheai_order_ids", JSON.stringify(ids.slice(0, 50)));
      }
    } catch {
      // ignore
    }

    toast.success("Pedido enviado! Procurando entregador...");
    const code = (data as { delivery_code?: string } | null)?.delivery_code;
    const newDeliveryId = (data as { id?: string } | null)?.id;
    if (newDeliveryId) {
      // Dispara push para entregadores online (sem bloquear UX)
      supabase.functions.invoke("notify-couriers", {
        body: {
          delivery_id: newDeliveryId,
          partner_name: partnerName,
          address: address.trim(),
        },
      }).catch((e) => console.warn("[notify-couriers] falhou", e));
    }
    const extra = code
      ? `✅ Pedido criado no app — entregador a caminho.\n🔐 Código de entrega: ${code}\n(informe ao entregador na entrega)`
      : "✅ Pedido criado no app — entregador a caminho.";
    openWa(buildWaMessage(extra));
    if (code) {
      toast.success(`🔐 Seu código de entrega: ${code}`, { duration: 8000 });
    }
    trackAnalyticsEvent("partner_click", { partner_name: partnerName ?? "", source: "cart_order" });
    clear();
    navigate("/pedidos?tab=historico");
  };

  const payWithMercadoPago = async () => {
    if (!partnerId) return;
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/carrinho")}`);
      return;
    }
    if (mode === "entrega" && !partnerHasDelivery) {
      toast.error("Esta loja não trabalha com entrega via app");
      return;
    }
    if (validation) {
      toast.error(validation);
      return;
    }
    setPayingMp(true);
    try {
      const backUrl = `${window.location.origin}/pagamento/retorno`;
      console.log("[MP] Criando preferência", { partnerId, amount: totalValue });
      const { data, error } = await supabase.functions.invoke("mp-create-preference", {
        body: {
          partner_id: partnerId,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          delivery_address: mode === "entrega" ? address.trim() : "Retirada na loja",
          order_description: buildOrderDescription(),
          amount: Number(finalValue.toFixed(2)),
          coupon_code: couponApplied?.code ?? null,
          fulfillment_type: mode === "retirar" ? "pickup" : "delivery",
          back_url: backUrl,
        },
      });
      console.log("[MP] Resposta", { data, error });
      // Edge function pode retornar erro no body (4xx/5xx). Lemos o body para exibir mensagem amigável.
      let payload = (data ?? {}) as { init_point?: string; error?: string; details?: unknown };
      if (error) {
        let realMsg = "";
        try {
          // FunctionsHttpError expõe a Response em error.context
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ctx = (error as any).context as Response | undefined;
          if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            try {
              const parsed = JSON.parse(txt);
              payload = parsed;
              realMsg = parsed?.error || parsed?.message || "";
            } catch {
              realMsg = txt?.slice(0, 200) || "";
            }
          }
        } catch { /* ignore */ }
        if (!realMsg) realMsg = payload?.error || "Não foi possível iniciar o pagamento. Tente novamente em instantes.";
        throw new Error(realMsg);
      }
      if (payload.error) throw new Error(payload.error);
      const init = payload as { init_point?: string };
      const url = init?.init_point;
      if (!url || !/^https:\/\/www\.mercadopago\.com/.test(url)) {
        throw new Error("URL de checkout inválida");
      }
      console.log("[MP] Redirecionando para checkout:", url);
      trackAnalyticsEvent("partner_click", { partner_name: partnerName ?? "", source: "cart_mp_checkout" });
      clear();
      window.location.href = url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao iniciar pagamento";
      console.error("[MP] Erro:", e);
      toast.error(msg, { description: "Verifique seus dados e tente novamente." });
    } finally {
      setPayingMp(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="px-4 pt-12 text-center animate-slide-up">
        <span className="text-6xl block mb-3">🛒</span>
        <h1 className="text-foreground font-black text-xl">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground text-sm mt-1">Escolha uma loja e adicione produtos!</p>
        <button
          onClick={() => navigate("/lojas")}
          className="mt-5 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-2xl text-sm active:scale-95 transition-transform"
        >
          Explorar lojas
        </button>
      </div>
    );
  }

  return (
    <div className="pb-56">
      <div className="bg-gradient-to-b from-secondary/20 to-background px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-3 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <ShoppingBag size={22} className="text-primary" /> Seu carrinho
        </h1>
        {partnerName && (
          <p className="text-xs text-muted-foreground mt-1">
            🏪 {partnerName} · {totalItems} {totalItems === 1 ? "item" : "itens"}
          </p>
        )}
      </div>

      <div className="max-w-sm mx-auto px-4 space-y-4">
        {!user && !authLoading && (
          <button
            onClick={() => navigate(`/auth?redirect=${encodeURIComponent("/carrinho")}`)}
            className="w-full flex items-center justify-between gap-2 rounded-2xl border-2 border-primary/40 bg-primary/5 p-3 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <LogIn size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-foreground">Entre pra finalizar</p>
                <p className="text-[10px] text-muted-foreground">Histórico, status em tempo real e mais</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-primary">Entrar →</span>
          </button>
        )}

        {/* Itens */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-2xl border border-border bg-card shadow-sm p-4 animate-slide-up"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">R${item.unitPrice.toFixed(2)} cada</p>
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground italic mt-1">📝 {item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-2 rounded-full text-destructive hover:bg-destructive/10 active:scale-90 transition-transform shrink-0"
                  aria-label="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-base font-black text-foreground w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border-2 border-border bg-background flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-base font-black text-primary">
                  R${(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modo de entrega */}
        <div className="rounded-2xl border border-border bg-card p-4 animate-slide-up">
          <p className="text-xs font-bold text-foreground mb-2">Como você quer receber?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("retirar")}
              className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                mode === "retirar" ? "border-primary bg-primary/10" : "border-border bg-background"
              }`}
            >
              <Package size={18} className={mode === "retirar" ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-black text-foreground mt-1">Retirar</p>
              <p className="text-[10px] text-muted-foreground">na loja</p>
            </button>
            <button
              onClick={() => partnerHasDelivery && setMode("entrega")}
              disabled={!partnerHasDelivery}
              className={`rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
                !partnerHasDelivery
                  ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"
                  : mode === "entrega"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
              }`}
            >
              <Bike size={18} className={mode === "entrega" && partnerHasDelivery ? "text-primary" : "text-muted-foreground"} />
              <p className="text-xs font-black text-foreground mt-1">Entrega</p>
              <p className="text-[10px] text-muted-foreground">
                {partnerHasDelivery ? "no endereço" : "indisponível"}
              </p>
            </button>
          </div>

          {!partnerHasDelivery && (
            <div className="flex items-start gap-2 rounded-xl bg-secondary/15 border border-secondary/40 p-3 mt-3">
              <AlertTriangle size={14} className="text-secondary mt-0.5 shrink-0" />
              <p className="text-[11px] font-semibold text-foreground leading-snug">
                Esta loja ainda não trabalha com entrega no app. Apenas retirada disponível.
              </p>
            </div>
          )}
        </div>

        {/* Dados do cliente */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-slide-up">
          <p className="text-xs font-bold text-foreground">Seus dados</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(33) 9..."
                inputMode="tel"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
            </div>
          </div>
          {mode === "entrega" && partnerHasDelivery && (
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">
                Endereço de entrega
              </label>
              {savedAddresses.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
                  {savedAddresses.map((a) => {
                    const active = address.trim() === a.address.trim();
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAddress(a.address)}
                        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 text-[10px] font-bold transition-colors ${
                          active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"
                        }`}
                      >
                        <MapPin size={10} /> {a.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, ponto de referência..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
              />
              {user && (
                <button
                  type="button"
                  onClick={() => navigate("/perfil?tab=enderecos")}
                  className="text-[10px] font-bold text-primary mt-1 active:scale-95"
                >
                  Gerenciar endereços salvos →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 animate-slide-up">
          <p className="text-xs font-black text-foreground uppercase tracking-wide mb-2">Resumo</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({totalItems} {totalItems === 1 ? "item" : "itens"})</span>
            <span className="font-bold text-foreground">R${totalValue.toFixed(2)}</span>
          </div>
          {couponApplied && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-bold flex items-center gap-1"><Ticket size={12} /> Desconto ({couponApplied.code})</span>
              <span className="font-black text-primary">- R${couponApplied.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega</span>
            {includeDelivery ? (
              loadingFee ? (
                <span className="text-xs text-muted-foreground">Calculando...</span>
              ) : (
                <span className="font-bold text-foreground">R${deliveryFee.toFixed(2)}</span>
              )
            ) : (
              <span className="font-bold text-muted-foreground text-xs">—</span>
            )}
          </div>
          {includeDelivery && feeZoneName && (
            <p className="text-[10px] text-muted-foreground -mt-1">
              {feeSource === "partner" && "🏪 Taxa da loja"}
              {feeSource === "zone" && `📍 Zona: ${feeZoneName}`}
              {feeSource === "default" && "📦 Taxa padrão (informe seu endereço para cálculo exato)"}
              {feeSource === "distance" && `🛵 Calculada pela distância (${feeDistance?.toFixed(1)} km)`}
              {feeSource === "free" && "🎉 Frete grátis aplicado!"}
              {feeSource === "out_of_range" && `⚠️ Fora da área de entrega (${feeDistance?.toFixed(1)} km)`}
            </p>
          )}
          <div className="border-t border-border pt-2 mt-1 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase">Total</p>
            </div>
            <p className="text-2xl font-black text-primary leading-none">R${finalValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Cupom */}
        <div className="rounded-2xl border border-border bg-card p-4 animate-slide-up">
          <p className="text-xs font-black text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Ticket size={12} className="text-primary" /> 🎟 Cupom de desconto
          </p>
          {couponApplied ? (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/30 p-2.5">
              <div className="min-w-0">
                <p className="text-sm font-black text-primary tracking-wider">✅ {couponApplied.code}</p>
                <p className="text-[10px] text-muted-foreground">Desconto de R$ {couponApplied.discount.toFixed(2)} aplicado</p>
              </div>
              <button onClick={() => setCouponApplied(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                  placeholder="DIGITE O CÓDIGO"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-bold tracking-wider"
                />
                <button
                  onClick={applyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="bg-primary text-primary-foreground font-black px-4 rounded-xl text-xs active:scale-95 disabled:opacity-60"
                >
                  {validatingCoupon ? "..." : "Aplicar"}
                </button>
              </div>
              {availableCoupons.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Cupons disponíveis</p>
                  <div className="space-y-1.5">
                    {availableCoupons.slice(0, 4).map((c) => {
                      const eligible = totalValue >= c.min_order;
                      const label = c.type === "percent" ? `${c.value}% OFF` : `R$ ${c.value.toFixed(2)} OFF`;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={!eligible || validatingCoupon}
                          onClick={() => { setCouponCode(c.code); applyCouponCode(c.code); }}
                          className={`w-full flex items-center justify-between gap-2 rounded-xl border p-2.5 text-left active:scale-[0.98] transition-all ${
                            eligible ? "border-primary/30 bg-primary/5" : "border-border bg-muted/40 opacity-60"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-foreground tracking-wider">🎟 {c.code} <span className="text-primary">— {label}</span></p>
                            {c.description && <p className="text-[10px] text-muted-foreground truncate">{c.description}</p>}
                            {!eligible && <p className="text-[10px] text-destructive">Mínimo R$ {c.min_order.toFixed(2)}</p>}
                          </div>
                          <span className="text-[10px] font-black text-primary shrink-0">{eligible ? "Aplicar →" : "—"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CTA fixo — acima da BottomNav (h ~14) e do AdBanner */}
      <div
        className="fixed left-0 right-0 z-50 px-4 pt-3 pb-3 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-sm mx-auto space-y-2">
          {validation && (
            <p className="text-[10px] text-center text-destructive font-bold">{validation}</p>
          )}
          {mode === "entrega" && partnerHasDelivery ? (
            <>
              <button
                onClick={payWithMercadoPago}
                disabled={payingMp || submitting || !!validation}
                className="w-full bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] disabled:opacity-60 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-between gap-2 text-base shadow-lg px-5"
              >
                <span className="flex items-center gap-2">
                  {payingMp ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                  {payingMp ? "Abrindo pagamento..." : "Ir para pagamento"}
                </span>
                <span className="font-black">R${finalValue.toFixed(2)}</span>
              </button>
              <button
                onClick={confirmOrder}
                disabled={submitting || !!validation}
                className="w-full bg-card border-2 border-border hover:bg-accent disabled:opacity-60 text-foreground font-bold py-2.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {submitting ? "Enviando..." : "Pedir sem pagar agora (combinar na entrega)"}
              </button>
            </>
          ) : mode === "retirar" ? (
            <>
              <button
                onClick={payWithMercadoPago}
                disabled={payingMp || submitting || !!validation}
                className="w-full bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] disabled:opacity-60 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-between gap-2 text-base shadow-lg px-5"
              >
                <span className="flex items-center gap-2">
                  {payingMp ? <Loader2 size={20} className="animate-spin" /> : <CreditCard size={20} />}
                  {payingMp ? "Abrindo pagamento..." : "Pagar e retirar na loja 🛍"}
                </span>
                <span className="font-black">R${finalValue.toFixed(2)}</span>
              </button>
              <button
                onClick={confirmOrder}
                disabled={submitting || !!validation}
                className="w-full bg-card border-2 border-border hover:bg-accent disabled:opacity-60 text-foreground font-bold py-2.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                {submitting ? "Enviando..." : "Combinar com a loja via WhatsApp"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={confirmOrder}
                disabled={submitting || !!validation}
                className="w-full bg-gradient-to-r from-[hsl(142,71%,45%)] to-[hsl(142,71%,38%)] disabled:opacity-60 text-white font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-between gap-2 text-base shadow-lg px-5"
              >
                <span className="flex items-center gap-2">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                  {submitting ? "Enviando..." : "Finalizar pedido"}
                </span>
                <span className="font-black">R${finalValue.toFixed(2)}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
