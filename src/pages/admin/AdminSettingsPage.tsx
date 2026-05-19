import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminFeesTab from "@/components/admin/AdminFeesTab";
import MaintenanceModePanel from "@/components/admin/MaintenanceModePanel";
import { ToggleLeft, ToggleRight, DollarSign, Settings as SettingsIcon } from "lucide-react";

interface Setting { id: string; key: string; value: any; description: string; }

const FLAG_LABELS: Record<string, string> = {
  online_payment_enabled: "Pagamento online (Mercado Pago)",
  show_recipes: "Exibir seção de receitas",
  show_videos: "Exibir seção de vídeos",
  maintenance_mode: "Modo manutenção (bloqueia novos pedidos)",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*").order("key");
    setSettings(((data as Setting[]) || []).filter((s) => s.key !== "maintenance_config"));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (s: Setting) => {
    const newValue = !s.value;
    const { error } = await supabase.from("app_settings").update({ value: newValue }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    setSettings((prev) => prev.map((x) => x.id === s.id ? { ...x, value: newValue } : x));
    toast.success("Configuração atualizada");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Taxas e funcionalidades do sistema.</p>
      </div>
      <section className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><SettingsIcon size={14} /></div>
          <div>
            <p className="text-sm font-black text-foreground">Funcionalidades</p>
            <p className="text-[11px] text-muted-foreground">Ative ou desative recursos do app instantaneamente.</p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {settings.map((s) => {
              const active = !!s.value;
              return (
                <button key={s.id} onClick={() => toggle(s)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{FLAG_LABELS[s.key] || s.key}</p>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                  {active ? <ToggleRight size={32} className="text-primary shrink-0" /> : <ToggleLeft size={32} className="text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </section>
      <MaintenanceModePanel />
      <section className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center"><DollarSign size={14} /></div>
          <div>
            <p className="text-sm font-black text-foreground">Taxas</p>
            <p className="text-[11px] text-muted-foreground">Configurações de entrega e comissão.</p>
          </div>
        </div>
        <AdminFeesTab />
      </section>
    </div>
  );
}
