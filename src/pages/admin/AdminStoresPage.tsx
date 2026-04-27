import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";

export default function AdminStoresPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("partner_applications").select("*").order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-stores-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Lojas (Parceiros)</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : `${partners.length} lojas cadastradas`}
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <AdminPartnersTab partners={partners} onRefresh={load} />
      </div>
    </div>
  );
}