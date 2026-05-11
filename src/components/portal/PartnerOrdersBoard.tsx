import { useMemo, useState } from "react";
import { ChefHat, Bike, Package, CheckCircle2, MapPin, Clock, Star, AlertCircle, Truck } from "lucide-react";

interface Delivery {
  id: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  status: string;
  courier_id: string | null;
  created_at: string;
  order_value?: number;
  prep_status?: string;
  fulfillment_type?: string | null;
}

const COLUMNS = [
  { id: "disponivel", label: "Novos", color: "blue", icon: AlertCircle },
  { id: "aceita", label: "Preparando", color: "amber", icon: ChefHat },
  { id: "em_andamento", label: "Em entrega", color: "orange", icon: Bike },
  { id: "concluida", label: "Concluídos", color: "emerald", icon: CheckCircle2 },
] as const;

const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30", dot: "bg-amber-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/30", dot: "bg-orange-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/30", dot: "bg-emerald-500" },
};

interface Props {
  deliveries: Delivery[];
  ratedIds: Set<string>;
  onAdvance: (id: string, next: "aceita" | "em_andamento" | "concluida" | "cancelada") => void;
  onCallCourier: (id: string) => void;
  onRate: (d: Delivery) => void;
}

export default function PartnerOrdersBoard({ deliveries, ratedIds, onAdvance, onCallCourier, onRate }: Props) {
  const [active, setActive] = useState<typeof COLUMNS[number]["id"]>("disponivel");
  const [filter, setFilter] = useState<"all" | "pickup" | "delivery">("all");

  const grouped = useMemo(() => {
    const g: Record<string, Delivery[]> = { disponivel: [], aceita: [], em_andamento: [], concluida: [] };
    deliveries
      .filter((d) => filter === "all" || (filter === "pickup" ? d.fulfillment_type === "pickup" : d.fulfillment_type !== "pickup"))
      .forEach((d) => {
        if (g[d.status]) g[d.status].push(d);
      });
    return g;
  }, [deliveries, filter]);

  const list = grouped[active] || [];

  return (
    <div className="space-y-3">
      {/* Filtro tipo */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {([
          { id: "all", label: "Todos" },
          { id: "delivery", label: "🛵 Entrega" },
          { id: "pickup", label: "🛍 Retirada" },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
              filter === f.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Colunas (status pills) */}
      <div className="grid grid-cols-4 gap-1.5">
        {COLUMNS.map((c) => {
          const cm = colorMap[c.color];
          const count = grouped[c.id]?.length || 0;
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`relative rounded-2xl p-2 border transition-all active:scale-95 ${
                isActive ? `${cm.bg} ${cm.border}` : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <c.icon size={14} className={isActive ? cm.text : "text-muted-foreground"} />
              </div>
              <p className={`text-[10px] font-black leading-tight ${isActive ? cm.text : "text-foreground"}`}>{c.label}</p>
              <p className={`text-base font-black ${isActive ? cm.text : "text-muted-foreground"}`}>{count}</p>
              {count > 0 && c.id === "disponivel" && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista da coluna ativa */}
      {list.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <Truck size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-bold text-foreground">Nenhum pedido nesta coluna</p>
          <p className="text-xs text-muted-foreground mt-1">Os pedidos aparecem em tempo real.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((d) => {
            const isPickup = d.fulfillment_type === "pickup";
            const isPaidNew = d.status === "disponivel";
            const ago = timeAgo(d.created_at);
            return (
              <li key={d.id} className={`bg-card rounded-2xl border p-3 transition-all ${
                isPaidNew ? "border-blue-500/40 ring-2 ring-blue-500/20 shadow-md" : "border-border"
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground line-clamp-2">{d.order_description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {ago}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {d.order_value ? (
                      <span className="text-sm font-black text-primary">R$ {Number(d.order_value).toFixed(2)}</span>
                    ) : null}
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isPickup ? "bg-orange-500/15 text-orange-700" : "bg-emerald-500/15 text-emerald-700"
                    }`}>
                      {isPickup ? "🛍 Retirada" : "🛵 Entrega"}
                    </span>
                  </div>
                </div>

                {!isPickup && (
                  <p className="text-[11px] text-muted-foreground flex items-start gap-1 mt-2">
                    <MapPin size={10} className="mt-0.5 shrink-0" /> {d.delivery_address}
                  </p>
                )}
                {d.notes && <p className="text-[11px] text-muted-foreground italic mt-1">"{d.notes}"</p>}

                {!isPickup && d.prep_status && d.prep_status !== "ready" && d.status === "disponivel" && (
                  <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/40 p-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-700">
                      {d.prep_status === "pending" ? "⏳ Aguardando preparo" : "👨‍🍳 Em preparo"}
                    </span>
                    <button
                      onClick={() => onCallCourier(d.id)}
                      className="bg-primary text-primary-foreground text-[11px] font-black px-3 py-1.5 rounded-lg active:scale-95"
                    >
                      🚚 Chamar entregador
                    </button>
                  </div>
                )}

                {!d.courier_id && d.status !== "concluida" && d.status !== "cancelada" && (
                  <div className="mt-2.5 grid grid-cols-1 gap-1.5">
                    {d.status === "disponivel" && (
                      <button
                        onClick={() => onAdvance(d.id, "aceita")}
                        className="bg-amber-500/15 border border-amber-500/40 text-amber-700 font-black text-xs py-2.5 rounded-xl active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ChefHat size={14} /> Marcar em preparo
                      </button>
                    )}
                    {d.status === "aceita" && (
                      <button
                        onClick={() => onAdvance(d.id, "em_andamento")}
                        className="bg-orange-500/15 border border-orange-500/40 text-orange-700 font-black text-xs py-2.5 rounded-xl active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        {isPickup ? <><Package size={14} /> Pronto para retirada</> : <><Bike size={14} /> Saiu para entrega</>}
                      </button>
                    )}
                    {d.status === "em_andamento" && (
                      <button
                        onClick={() => onAdvance(d.id, "concluida")}
                        className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 font-black text-xs py-2.5 rounded-xl active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> {isPickup ? "Retirado pelo cliente" : "Marcar como entregue"}
                      </button>
                    )}
                  </div>
                )}

                {d.status === "concluida" && d.courier_id && (
                  ratedIds.has(d.id) ? (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <Star size={12} className="fill-emerald-600" /> Entregador avaliado
                    </div>
                  ) : (
                    <button
                      onClick={() => onRate(d)}
                      className="w-full mt-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 font-black text-xs py-2 rounded-xl active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Star size={12} /> Avaliar entregador
                    </button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}
