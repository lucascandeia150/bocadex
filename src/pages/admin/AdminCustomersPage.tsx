import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Phone, ShoppingBag, DollarSign } from "lucide-react";

interface Payment { id: string; status: string; amount: number; customer_name: string | null; customer_phone: string | null; created_at: string; }

export default function AdminCustomersPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payments").select("id,status,amount,customer_name,customer_phone,created_at").order("created_at", { ascending: false }).limit(2000);
      setPayments((data as Payment[]) || []);
      setLoading(false);
    })();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, { phone: string; name: string; orders: number; spent: number; lastOrder: Date; }>();
    payments.forEach((p) => {
      const phone = (p.customer_phone || "").trim();
      if (!phone) return;
      const cur = map.get(phone) || { phone, name: p.customer_name || "—", orders: 0, spent: 0, lastOrder: new Date(p.created_at) };
      cur.orders += 1;
      if (p.status === "approved") cur.spent += Number(p.amount || 0);
      const t = new Date(p.created_at);
      if (t > cur.lastOrder) { cur.lastOrder = t; cur.name = p.customer_name || cur.name; }
      map.set(phone, cur);
    });
    const list = Array.from(map.values()).sort((a, b) => b.lastOrder.getTime() - a.lastOrder.getTime());
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
  }, [payments, search]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">{customers.length} clientes únicos identificados pelos pedidos.</p>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm" />
      </div>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center"><Users className="mx-auto text-muted-foreground mb-2" size={28} /><p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p></div>
        ) : customers.map((c) => (
          <div key={c.phone} className="p-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">{c.name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone size={10} /> {c.phone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-foreground flex items-center gap-1 justify-end"><ShoppingBag size={10} /> {c.orders}</p>
              <p className="text-[11px] text-green-600 font-bold flex items-center gap-1 justify-end"><DollarSign size={10} /> {fmt(c.spent)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
