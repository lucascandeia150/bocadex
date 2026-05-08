import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, KeyRound, Power, Wifi, WifiOff } from "lucide-react";

interface Courier {
  id: string; name: string; phone: string; vehicle: string;
  is_active: boolean; is_online: boolean; last_seen_at: string | null;
  access_pin: string | null;
}

export default function AdminCouriersManageTab() {
  const [items, setItems] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("couriers")
      .select("id,name,phone,vehicle,is_active,is_online,last_seen_at,access_pin")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setItems((data as Courier[]) || []);
  };

  useEffect(() => { load(); }, []);

  const resetPin = async (id: string) => {
    const { data, error } = await supabase.rpc("admin_reset_courier_pin", { _courier_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success(`Novo PIN: ${(data as any)?.access_pin ?? "gerado"}`);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.rpc("admin_toggle_courier_active", { _courier_id: id, _active: !current });
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Ativado" : "Desativado");
    load();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-foreground">🛵 Entregadores</h3>
        <button onClick={load} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-black text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.phone} · {c.vehicle}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  PIN: <span className="font-mono font-bold">{c.access_pin || "—"}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${c.is_online ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {c.is_online ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {c.is_online ? "Online" : "Offline"}
                </span>
                {!c.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-destructive/10 text-destructive">INATIVO</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => resetPin(c.id)} className="flex-1 min-h-[40px] text-xs font-bold rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-1">
                <KeyRound size={12} /> Reset PIN
              </button>
              <button onClick={() => toggleActive(c.id, c.is_active)} className="flex-1 min-h-[40px] text-xs font-bold rounded-lg bg-muted text-foreground flex items-center justify-center gap-1">
                <Power size={12} /> {c.is_active ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm py-6">Nenhum entregador cadastrado</p>
        )}
      </div>
    </div>
  );
}
