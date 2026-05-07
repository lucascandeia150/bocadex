import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Pause, Play, Ban, Percent, RefreshCw, Bike, Copy, Save } from "lucide-react";

interface Partner {
  id: string;
  business_name: string;
  store_status?: string | null;
  commission_percent?: number | null;
  uses_app_courier: boolean;
  access_pin: string | null;
  is_active: boolean;
  is_open: boolean;
}

export default function AdminManageStoreDialog({
  partner,
  open,
  onOpenChange,
  onUpdated,
}: {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [commission, setCommission] = useState<string>("");

  useEffect(() => {
    if (partner) setCommission(partner.commission_percent != null ? String(partner.commission_percent) : "");
  }, [partner]);

  if (!open || !partner) return null;

  const status = (partner.store_status as string) || "active";

  const setStatus = async (newStatus: "active" | "paused" | "blocked") => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_store_status", { _partner_id: partner.id, _status: newStatus });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    onUpdated();
  };

  const saveCommission = async () => {
    setBusy(true);
    const value = commission.trim() === "" ? null : Number(commission);
    if (value !== null && (isNaN(value) || value < 0 || value > 100)) {
      setBusy(false);
      return toast.error("Comissão deve estar entre 0 e 100");
    }
    const { error } = await supabase.rpc("admin_set_partner_commission", { _partner_id: partner.id, _percent: value as any });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Comissão atualizada");
    onUpdated();
  };

  const resetPin = async () => {
    if (!confirm("Gerar novo PIN para esta loja? O PIN antigo deixará de funcionar.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_reset_partner_pin", { _partner_id: partner.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    const pin = (data as any)?.access_pin;
    if (pin) {
      navigator.clipboard.writeText(pin).catch(() => {});
      toast.success(`Novo PIN: ${pin} (copiado)`);
    } else toast.success("PIN regenerado");
    onUpdated();
  };

  const toggleCourier = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_toggle_uses_app_courier", {
      _partner_id: partner.id,
      _value: !partner.uses_app_courier,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    onUpdated();
  };

  const copyPin = () => {
    if (!partner.access_pin) return;
    navigator.clipboard.writeText(partner.access_pin);
    toast.success("PIN copiado");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-base font-black text-foreground truncate">Gerenciar loja</h2>
            <p className="text-xs text-muted-foreground truncate">{partner.business_name}</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-5">
          <Section title="Status da loja">
            <div className="grid grid-cols-3 gap-2">
              <StatusBtn active={status === "active"} onClick={() => setStatus("active")} disabled={busy} icon={<Play size={12} />} label="Ativa" tone="green" />
              <StatusBtn active={status === "paused"} onClick={() => setStatus("paused")} disabled={busy} icon={<Pause size={12} />} label="Pausada" tone="yellow" />
              <StatusBtn active={status === "blocked"} onClick={() => setStatus("blocked")} disabled={busy} icon={<Ban size={12} />} label="Bloqueada" tone="red" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Pausada/bloqueada fecha automaticamente a loja.</p>
          </Section>

          <Section title="Comissão personalizada (%)">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Percent size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number" min={0} max={100} step={0.5}
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="Padrão (delivery_settings)"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm"
                />
              </div>
              <button onClick={saveCommission} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg disabled:opacity-50">
                <Save size={12} /> Salvar
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Deixe em branco para usar a comissão padrão.</p>
          </Section>

          <Section title="Entregador do app">
            <button onClick={toggleCourier} disabled={busy} className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${partner.uses_app_courier ? "bg-blue-500/10 border-blue-500/30 text-blue-600" : "bg-muted border-border text-muted-foreground"}`}>
              <span className="flex items-center gap-2 text-xs font-bold"><Bike size={12} /> Usa entregador do app</span>
              <span className="text-[11px] font-bold">{partner.uses_app_courier ? "Ativado" : "Desativado"}</span>
            </button>
          </Section>

          <Section title="Acesso (PIN)">
            <div className="flex items-center gap-2">
              <button onClick={copyPin} className="flex-1 flex items-center justify-between gap-2 bg-muted hover:bg-muted/70 px-3 py-2 rounded-lg">
                <span className="text-[11px] text-muted-foreground">PIN atual</span>
                <span className="text-sm font-black tracking-widest text-primary flex items-center gap-1">
                  {partner.access_pin || "—"} <Copy size={11} />
                </span>
              </button>
              <button onClick={resetPin} disabled={busy} className="flex items-center gap-1 text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-2 rounded-lg disabled:opacity-50">
                <RefreshCw size={12} /> Resetar
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}

function StatusBtn({ active, onClick, disabled, icon, label, tone }: {
  active: boolean; onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; tone: "green" | "yellow" | "red";
}) {
  const tones: Record<string, string> = {
    green: "bg-green-500/10 text-green-600 border-green-500/30",
    yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    red: "bg-red-500/10 text-red-600 border-red-500/30",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-50 ${active ? tones[tone] : "bg-muted text-muted-foreground border-border hover:bg-muted/70"}`}>
      {icon} {label}
    </button>
  );
}