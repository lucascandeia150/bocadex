import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, RefreshCw, MapPin, ArrowLeft, LogOut, MessageCircle, Check, X } from "lucide-react";

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
}

interface Delivery {
  id: string;
  partner_id: string | null;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  status: string;
  courier_id: string | null;
  partner_whatsapp: string | null;
  created_at: string;
}

const PIN_KEY = "escolheai_courier_pin";
const SEEN_KEY = "escolheai_courier_seen_ids";

export default function PortalEntregadorPage() {
  const [pin, setPin] = useState("");
  const [courier, setCourier] = useState<Courier | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(PIN_KEY);
    if (saved) {
      setPin(saved);
      tryLogin(saved, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryLogin = async (code: string, silent = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("courier_login", { _pin: code });
    setLoading(false);
    if (error || !data || data.length === 0) {
      if (!silent) toast.error("PIN inválido");
      localStorage.removeItem(PIN_KEY);
      setCourier(null);
      return;
    }
    setCourier(data[0] as Courier);
    localStorage.setItem(PIN_KEY, code);
    loadDeliveries(code, true);
  };

  const loadDeliveries = async (code: string, markSeen = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("courier_list_deliveries", { _pin: code });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar pedidos"); return; }
    const list = (data as Delivery[]) || [];
    setDeliveries(list);

    const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    const availableIds = list.filter((d) => d.status === "disponivel").map((d) => d.id);
    const newOnes = availableIds.filter((id) => !seen.includes(id));
    setNewCount(newOnes.length);
    if (markSeen) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(availableIds));
      setNewCount(0);
    }
  };

  const refresh = () => loadDeliveries(pin, true);

  const logout = () => {
    localStorage.removeItem(PIN_KEY);
    setCourier(null);
    setPin("");
    setDeliveries([]);
  };

  const action = async (id: string, act: "accept" | "finish" | "release") => {
    const { error } = await supabase.rpc("courier_update_delivery", {
      _pin: pin,
      _delivery_id: id,
      _action: act,
    });
    if (error) { toast.error(error.message || "Erro"); return; }
    toast.success(act === "accept" ? "Aceito ✅" : act === "finish" ? "Finalizado ✅" : "Liberado");
    loadDeliveries(pin, true);
  };

  if (!courier) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
        <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </a>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
          <Truck className="mx-auto text-primary" size={40} />
          <h1 className="text-lg font-black text-foreground">Portal do Entregador</h1>
          <p className="text-xs text-muted-foreground">Digite seu PIN de 6 dígitos.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full text-center text-2xl font-black tracking-widest bg-muted rounded-xl px-3 py-3"
          />
          <button
            disabled={loading || pin.length !== 6}
            onClick={() => tryLogin(pin)}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  const available = deliveries.filter((d) => d.status === "disponivel");
  const mine = deliveries.filter((d) => d.courier_id === courier.id && d.status !== "concluida");

  return (
    <div className="p-4 max-w-md mx-auto space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Portal do entregador</p>
          <h1 className="text-base font-black text-foreground">{courier.name}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="relative p-2 rounded-xl bg-muted">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {newCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {newCount}
              </span>
            )}
          </button>
          <button onClick={logout} className="p-2 rounded-xl bg-destructive/10 text-destructive">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
        💡 O pagamento da entrega é combinado diretamente com a loja.
      </div>

      {mine.length > 0 && (
        <div>
          <h2 className="text-xs font-black text-foreground mb-2">🚚 Em andamento ({mine.length})</h2>
          <div className="space-y-2">
            {mine.map((d) => (
              <DeliveryCard
                key={d.id}
                d={d}
                onFinish={() => action(d.id, "finish")}
                onRelease={() => action(d.id, "release")}
                accepted
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs font-black text-foreground mb-2">📦 Pedidos disponíveis ({available.length})</h2>
        <div className="space-y-2">
          {available.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">Nenhum pedido disponível 🕐</p>
          )}
          {available.map((d) => (
            <DeliveryCard
              key={d.id}
              d={d}
              onAccept={() => action(d.id, "accept")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DeliveryCard({
  d,
  onAccept,
  onFinish,
  onRelease,
  accepted,
}: {
  d: Delivery;
  onAccept?: () => void;
  onFinish?: () => void;
  onRelease?: () => void;
  accepted?: boolean;
}) {
  const wa = d.partner_whatsapp?.replace(/\D/g, "");
  return (
    <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground truncate">{d.partner_name}</p>
          <p className="text-xs text-muted-foreground">{d.order_description}</p>
        </div>
        <span className="text-sm font-black text-primary whitespace-nowrap">R$ {Number(d.fee).toFixed(2)}</span>
      </div>
      <p className="text-xs text-foreground flex items-start gap-1">
        <MapPin size={12} className="mt-0.5 shrink-0" /> {d.delivery_address}
      </p>
      {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        {!accepted && onAccept && (
          <button onClick={onAccept} className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2 rounded-lg active:scale-95">
            <Check size={12} className="inline mr-1" /> Aceitar
          </button>
        )}
        {accepted && wa && (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent("Olá! Sou o entregador do pedido " + d.order_description)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-600 text-white font-bold text-xs py-2 rounded-lg active:scale-95 text-center"
          >
            <MessageCircle size={12} className="inline mr-1" /> Falar com a loja
          </a>
        )}
        {accepted && onFinish && (
          <button onClick={onFinish} className="flex-1 bg-primary text-primary-foreground font-bold text-xs py-2 rounded-lg active:scale-95">
            <Check size={12} className="inline mr-1" /> Finalizar
          </button>
        )}
        {accepted && onRelease && (
          <button onClick={onRelease} className="px-3 bg-muted text-muted-foreground font-bold text-xs py-2 rounded-lg active:scale-95">
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}