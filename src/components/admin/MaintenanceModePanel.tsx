import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Power, Wrench, ImageIcon, Clock, Save } from "lucide-react";
import type { MaintenanceConfig } from "@/hooks/useMaintenance";

const DEFAULT: MaintenanceConfig = {
  enabled: false,
  message:
    "Estamos realizando alguns reajustes e melhorias no sistema. Desculpe pelo inconveniente. Tente novamente em alguns minutos.",
  returns_at: null,
  banner_url: null,
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function MaintenanceModePanel() {
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("id, value")
      .eq("key", "maintenance_config")
      .maybeSingle();
    if (data) {
      setId(data.id);
      setConfig({ ...DEFAULT, ...(data.value as any) });
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (next: MaintenanceConfig) => {
    setSaving(true);
    const payload = {
      key: "maintenance_config",
      value: next,
      description: "Configuração do modo manutenção global",
    };
    const q = id
      ? supabase.from("app_settings").update({ value: next }).eq("id", id)
      : supabase.from("app_settings").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return false; }
    setConfig(next);
    return true;
  };

  const toggle = async () => {
    const ok = await save({ ...config, enabled: !config.enabled });
    if (ok) toast.success(!config.enabled ? "Modo manutenção ATIVADO" : "Modo manutenção desativado");
  };

  const saveAll = async () => {
    const ok = await save(config);
    if (ok) toast.success("Configurações salvas");
  };

  if (loading) return <div className="h-40 rounded-xl bg-muted animate-pulse" />;

  return (
    <section className={`border-2 rounded-2xl p-4 ${config.enabled ? "border-destructive bg-destructive/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.enabled ? "bg-destructive/15 text-destructive" : "bg-orange-500/10 text-orange-600"}`}>
          <Wrench size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground">Modo Manutenção Global</p>
          <p className="text-[11px] text-muted-foreground">
            {config.enabled ? "App bloqueado para clientes, parceiros e entregadores." : "App acessível normalmente."}
          </p>
        </div>
      </div>

      <button
        onClick={toggle}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl mb-4 transition-colors ${
          config.enabled
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        } disabled:opacity-60`}
      >
        <Power size={16} />
        {config.enabled ? "Desativar modo manutenção" : "Ativar modo manutenção"}
      </button>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase">Mensagem exibida</label>
          <textarea
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            rows={3}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock size={11} /> Previsão de retorno</label>
          <input
            type="datetime-local"
            value={toLocalInput(config.returns_at)}
            onChange={(e) => setConfig({ ...config, returns_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1"><ImageIcon size={11} /> URL do banner (opcional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={config.banner_url ?? ""}
            onChange={(e) => setConfig({ ...config, banner_url: e.target.value || null })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-bold py-2.5 rounded-xl disabled:opacity-60"
        >
          <Save size={14} /> Salvar configurações
        </button>
      </div>
    </section>
  );
}