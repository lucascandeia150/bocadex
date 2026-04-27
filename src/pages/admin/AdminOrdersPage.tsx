import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDeliveriesTab from "@/components/admin/AdminDeliveriesTab";

export default function AdminOrdersPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false }).limit(500);
    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${deliveries.length} pedidos · atualiza em tempo real`}
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <AdminDeliveriesTab deliveries={deliveries} onChange={load} />
      </div>
    </div>
  );
}