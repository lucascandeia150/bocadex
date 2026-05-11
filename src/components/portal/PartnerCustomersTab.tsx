import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, Phone, Star, RefreshCw, Search } from "lucide-react";
import { fmtBRL } from "@/lib/dashboardDemo";

interface Delivery {
  id: string;
  user_id: string | null;
  partner_name: string;
  order_value: number | null;
  created_at: string;
  status: string;
}
interface Profile { id: string; name: string | null; phone: string | null; }

export default function PartnerCustomersTab({ partnerId }: { partnerId: string }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: dels } = await supabase
      .from("deliveries")
      .select("id, user_id, partner_name, order_value, created_at, status")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(1000);
    const list = (dels as Delivery[]) || [];
    setDeliveries(list);
    const userIds = [...new Set(list.map((d) => d.user_id).filter(Boolean) as string[])];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .in("id", userIds);
      const map: Record<string, Profile> = {};
      ((profs as Profile[]) || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [partnerId]);

  const customers = useMemo(() => {
    const map = new Map<string, { user_id: string; name: string; phone: string; orders: number; total: number; last: string; vip: boolean }>();
    deliveries.forEach((d) => {
      const key = d.user_id || `anon-${d.id}`;
      const prof = d.user_id ? profiles[d.user_id] : null;
      const cur = map.get(key) || {
        user_id: d.user_id || "",
        name: prof?.name || "Cliente",
        phone: prof?.phone || "",
        orders: 0,
        total: 0,
        last: d.created_at,
        vip: false,
      };
      cur.orders += 1;
      cur.total += Number(d.order_value || 0);
      if (new Date(d.created_at) > new Date(cur.last)) cur.last = d.created_at;
      cur.vip = cur.orders >= 5;
      map.set(key, cur);
    });
    let arr = [...map.values()].sort((a, b) => b.orders - a.orders);
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t));
    }
    return arr;
  }, [deliveries, profiles, q]);

  const totals = useMemo(() => ({
    unique: customers.length,
    vip: customers.filter((c) => c.vip).length,
    repeat: customers.filter((c) => c.orders >= 2).length,
  }), [customers]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-foreground flex items-center gap-2">
          <Users size={16} className="text-primary" /> Clientes
        </h2>
        <button onClick={load} className="p-1.5 rounded-full bg-muted active:scale-95">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Únicos" value={totals.unique} tone="primary" />
        <Stat label="Recorrentes" value={totals.repeat} tone="amber" />
        <Stat label="VIP (5+)" value={totals.vip} tone="emerald" />
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente por nome ou telefone..."
          className="w-full bg-muted rounded-xl pl-9 pr-3 py-2.5 text-sm"
        />
      </div>

      {customers.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <Users size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-bold text-foreground">Nenhum cliente ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Os clientes aparecem aqui após o primeiro pedido.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {customers.slice(0, 100).map((c, i) => (
            <li key={c.user_id || i} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                c.vip ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-primary/10 text-primary"
              }`}>
                {c.vip ? <Crown size={16} /> : c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-black text-foreground truncate">{c.name}</p>
                  {c.vip && <span className="text-[9px] font-black bg-amber-500/15 text-amber-700 px-1.5 py-0.5 rounded-full">VIP</span>}
                </div>
                {c.phone && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone size={10} /> {c.phone}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Último pedido: {new Date(c.last).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-foreground">{c.orders}</p>
                <p className="text-[9px] text-muted-foreground uppercase">pedidos</p>
                <p className="text-[10px] font-bold text-primary mt-0.5">{fmtBRL(c.total)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "primary" | "amber" | "emerald" }) {
  const m = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-600",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
  } as const;
  return (
    <div className={`rounded-xl border p-2 text-center ${m[tone]}`}>
      <p className="text-lg font-black text-foreground">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}
