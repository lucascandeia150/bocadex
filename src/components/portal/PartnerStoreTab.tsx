import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, Power, Bike } from "lucide-react";

interface Store {
  id: string;
  business_name: string;
  description: string | null;
  address: string;
  whatsapp: string;
  logo_url: string | null;
  is_open: boolean;
}

export default function PartnerStoreTab({ pin, onChanged }: { pin: string; onChanged?: (s: Store) => void }) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customFee, setCustomFee] = useState<string>("");
  const [customPayout, setCustomPayout] = useState<string>("");
  const [savingFee, setSavingFee] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_login", { _pin: pin });
    setLoading(false);
    if (error || !data || data.length === 0) {
      toast.error("Erro ao carregar dados da loja");
      return;
    }
    const s = data[0] as any;
    setStore({
      id: s.id,
      business_name: s.business_name || "",
      description: s.description || "",
      address: s.address || "",
      whatsapp: s.whatsapp || "",
      logo_url: s.logo_url,
      is_open: !!s.is_open,
    });
    // busca taxa custom (campo não exposto pelo partner_login)
    const { data: extra } = await supabase
      .from("partner_applications")
      .select("custom_delivery_fee, custom_courier_payout")
      .eq("id", s.id)
      .maybeSingle();
    setCustomFee(extra?.custom_delivery_fee != null ? String(extra.custom_delivery_fee) : "");
    setCustomPayout(extra?.custom_courier_payout != null ? String(extra.custom_courier_payout) : "");
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("partner_update_store", {
      _pin: pin,
      _business_name: store.business_name,
      _description: store.description || "",
      _address: store.address,
      _whatsapp: store.whatsapp,
      _logo_url: store.logo_url,
      _is_open: store.is_open,
    });
    setSaving(false);
    if (error) { toast.error(error.message || "Erro ao salvar"); return; }
    toast.success("Loja atualizada ✅");
    if (data) onChanged?.(data as any);
  };

  const toggleOpen = async () => {
    if (!store) return;
    const { data, error } = await supabase.rpc("partner_toggle_open", { _pin: pin });
    if (error) { toast.error(error.message || "Erro"); return; }
    const s = data as any;
    setStore((prev) => prev ? { ...prev, is_open: s.is_open } : prev);
    toast.success(s.is_open ? "🟢 Loja aberta" : "🔴 Loja fechada");
    onChanged?.(s);
  };

  const uploadLogo = async (file: File) => {
    if (!store) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${store.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-images").upload(path, file, { upsert: true });
    if (error) { setUploading(false); toast.error("Erro no upload"); return; }
    const { data: pub } = supabase.storage.from("partner-images").getPublicUrl(path);
    setStore({ ...store, logo_url: pub.publicUrl });
    setUploading(false);
    toast.success("Logo carregada — clique em Salvar");
  };

  const saveFee = async () => {
    setSavingFee(true);
    const fee = customFee.trim() === "" ? null : Number(customFee);
    const payout = customPayout.trim() === "" ? null : Number(customPayout);
    const { error } = await supabase.rpc("partner_set_delivery_fee", {
      _pin: pin,
      _fee: fee,
      _courier_payout: payout,
    });
    setSavingFee(false);
    if (error) { toast.error(error.message); return; }
    toast.success(fee === null ? "Voltou para taxa por zona/padrão" : "Taxa atualizada ✅");
  };

  if (loading || !store) {
    return <p className="text-center text-muted-foreground text-sm py-10">Carregando...</p>;
  }

  return (
    <div className="space-y-3">
      {/* Status aberto/fechado */}
      <div className={`rounded-2xl border p-4 flex items-center justify-between ${store.is_open ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Status da loja</p>
          <p className={`text-base font-black ${store.is_open ? "text-green-600" : "text-red-600"}`}>
            {store.is_open ? "🟢 Aberta — recebendo pedidos" : "🔴 Fechada — não recebe pedidos"}
          </p>
        </div>
        <button
          onClick={toggleOpen}
          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 ${store.is_open ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
        >
          <Power size={12} /> {store.is_open ? "Fechar" : "Abrir"}
        </button>
      </div>

      {/* Logo */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-muted" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl">🏪</div>
          )}
          <label className="flex-1 cursor-pointer bg-muted hover:bg-muted/70 rounded-xl px-3 py-2 text-xs font-bold text-foreground flex items-center justify-center gap-1">
            <Upload size={12} />
            {uploading ? "Enviando..." : "Trocar logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
          </label>
        </div>

        <Field label="Nome da loja" value={store.business_name} onChange={(v) => setStore({ ...store, business_name: v })} />
        <TextArea label="Descrição" value={store.description || ""} onChange={(v) => setStore({ ...store, description: v })} />
        <Field label="Endereço" value={store.address} onChange={(v) => setStore({ ...store, address: v })} />
        <Field label="WhatsApp" value={store.whatsapp} onChange={(v) => setStore({ ...store, whatsapp: v })} />

        <button
          disabled={saving}
          onClick={save}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Save size={14} /> {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {/* Taxa de entrega custom */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Bike size={16} className="text-primary" />
          <p className="text-sm font-black text-foreground">Sua taxa de entrega</p>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Defina sua taxa fixa para todos os pedidos. Deixe em branco para usar a
          <strong> taxa por zona</strong> (ou a taxa padrão do app, se nenhuma zona corresponder).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Taxa cobrada (R$)" value={customFee} onChange={setCustomFee} />
          <Field label="Repasse entregador (R$)" value={customPayout} onChange={setCustomPayout} />
        </div>
        <button
          disabled={savingFee}
          onClick={saveFee}
          className="w-full bg-primary/10 text-primary font-bold py-2.5 rounded-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 text-sm"
        >
          <Save size={14} /> {savingFee ? "Salvando..." : "Salvar taxa"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1 resize-none"
      />
    </div>
  );
}