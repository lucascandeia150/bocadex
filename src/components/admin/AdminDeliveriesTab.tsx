import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Plus, Trash2, Settings, RefreshCw, Bike, Car, MapPin, Phone, DollarSign } from "lucide-react";

interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  is_active: boolean;
  access_pin?: string | null;
}

interface Delivery {
  id: string;
  partner_id: string | null;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  courier_payout: number;
  status: string;
  courier_id: string | null;
  created_at: string;
}

interface Settings {
  id: string;
  default_fee: number;
  default_courier_payout: number;
}

interface Partner {
  id: string;
  business_name: string;
  address: string;
}

const STATUSES = [
  { id: "disponivel", label: "Disponível", color: "bg-blue-500/10 text-blue-600" },
  { id: "aceita", label: "Aceita", color: "bg-yellow-500/10 text-yellow-600" },
  { id: "em_andamento", label: "Em andamento", color: "bg-orange-500/10 text-orange-600" },
  { id: "concluida", label: "Concluída", color: "bg-green-500/10 text-green-600" },
  { id: "cancelada", label: "Cancelada", color: "bg-red-500/10 text-red-600" },
];

type Sub = "list" | "new" | "couriers" | "settings";

export default function AdminDeliveriesTab() {
  const [sub, setSub] = useState<Sub>("list");
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);

  // New delivery form
  const [partnerId, setPartnerId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [orderDesc, setOrderDesc] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [payout, setPayout] = useState<number>(0);

  // New courier form
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cVehicle, setCVehicle] = useState("moto");

  const loadAll = async () => {
    setLoading(true);
    const [dRes, cRes, sRes, pRes] = await Promise.all([
      supabase.from("deliveries").select("*").order("created_at", { ascending: false }),
      supabase.from("couriers").select("*").order("name"),
      supabase.from("delivery_settings").select("*").limit(1).maybeSingle(),
      supabase.from("partner_applications").select("id, business_name, address").eq("status", "approved").eq("is_active", true).order("business_name"),
    ]);
    setDeliveries((dRes.data as Delivery[]) || []);
    setCouriers((cRes.data as Courier[]) || []);
    setSettings(sRes.data as Settings);
    setPartners((pRes.data as Partner[]) || []);
    if (sRes.data) {
      setFee(Number((sRes.data as Settings).default_fee));
      setPayout(Number((sRes.data as Settings).default_courier_payout));
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const onPartnerChange = (id: string) => {
    setPartnerId(id);
    const p = partners.find((x) => x.id === id);
    if (p) {
      setPartnerName(p.business_name);
      setAddress(p.address);
    }
  };

  const createDelivery = async () => {
    if (!partnerName.trim() || !orderDesc.trim() || !address.trim()) {
      toast.error("Preencha loja, pedido e endereço");
      return;
    }
    const { error } = await supabase.from("deliveries").insert({
      partner_id: partnerId || null,
      partner_name: partnerName.trim(),
      order_description: orderDesc.trim(),
      delivery_address: address.trim(),
      notes: notes.trim(),
      fee,
      courier_payout: payout,
      status: "disponivel",
    });
    if (error) { toast.error("Erro ao criar entrega"); return; }
    toast.success("Entrega criada ✅");
    setPartnerId(""); setPartnerName(""); setOrderDesc(""); setAddress(""); setNotes("");
    if (settings) { setFee(Number(settings.default_fee)); setPayout(Number(settings.default_courier_payout)); }
    setSub("list");
    loadAll();
  };

  const updateDelivery = async (id: string, patch: Partial<Delivery>) => {
    const { error } = await supabase.from("deliveries").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Atualizado ✅");
    loadAll();
  };

  const deleteDelivery = async (id: string) => {
    const { error } = await supabase.from("deliveries").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    setDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  const createCourier = async () => {
    if (!cName.trim() || !cPhone.trim()) { toast.error("Preencha nome e telefone"); return; }
    const { error } = await supabase.from("couriers").insert({
      name: cName.trim(), phone: cPhone.trim(), vehicle: cVehicle, is_active: true,
    });
    if (error) { toast.error("Erro ao cadastrar"); return; }
    toast.success("Entregador cadastrado ✅");
    setCName(""); setCPhone(""); setCVehicle("moto");
    loadAll();
  };

  const toggleCourier = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("couriers").update({ is_active: !is_active }).eq("id", id);
    if (error) { toast.error("Erro"); return; }
    loadAll();
  };

  const deleteCourier = async (id: string) => {
    const { error } = await supabase.from("couriers").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setCouriers((prev) => prev.filter((c) => c.id !== id));
    toast.success("Excluído ✅");
  };

  const saveSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from("delivery_settings")
      .update({ default_fee: settings.default_fee, default_courier_payout: settings.default_courier_payout })
      .eq("id", settings.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Configurações salvas ✅");
  };

  const totalRevenue = deliveries.filter((d) => d.status === "concluida").reduce((a, d) => a + Number(d.fee), 0);
  const totalPayout = deliveries.filter((d) => d.status === "concluida").reduce((a, d) => a + Number(d.courier_payout), 0);
  const profit = totalRevenue - totalPayout;
  const margin = settings ? Number(settings.default_fee) - Number(settings.default_courier_payout) : 0;

  const vehicleIcon = (v: string) => v === "bike" ? <Bike size={14} /> : v === "carro" ? <Car size={14} /> : <Truck size={14} />;

  return (
    <div className="space-y-3 animate-slide-up">
      {/* Sub tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {([
          { id: "list", label: "Entregas", icon: <Truck size={14} /> },
          { id: "new", label: "Solicitar", icon: <Plus size={14} /> },
          { id: "couriers", label: "Entregadores", icon: <Bike size={14} /> },
          { id: "settings", label: "Config", icon: <Settings size={14} /> },
        ] as { id: Sub; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              sub === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={loadAll} className="ml-auto p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* LIST */}
      {sub === "list" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground">Receita</p>
              <p className="text-base font-black text-foreground">R$ {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground">Entregadores</p>
              <p className="text-base font-black text-foreground">R$ {totalPayout.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3">
              <p className="text-[10px] text-muted-foreground">Lucro</p>
              <p className="text-base font-black text-primary">R$ {profit.toFixed(2)}</p>
            </div>
          </div>

          {deliveries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhuma entrega ainda 🚚</p>
          )}

          {deliveries.map((d) => {
            const status = STATUSES.find((s) => s.id === d.status) || STATUSES[0];
            return (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{d.partner_name}</p>
                    <p className="text-xs text-muted-foreground">{d.order_description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${status.color}`}>{status.label}</span>
                </div>
                <p className="text-xs text-foreground flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0" /> {d.delivery_address}
                </p>
                {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-foreground">Taxa: <b>R$ {Number(d.fee).toFixed(2)}</b></span>
                  <span className="text-muted-foreground">Entregador: R$ {Number(d.courier_payout).toFixed(2)}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <select
                    value={d.courier_id || ""}
                    onChange={(e) => updateDelivery(d.id, { courier_id: e.target.value || null, status: e.target.value ? "aceita" : d.status })}
                    className="text-xs bg-muted rounded-lg px-2 py-1 flex-1 min-w-[120px]"
                  >
                    <option value="">— Sem entregador —</option>
                    {couriers.filter((c) => c.is_active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={d.status}
                    onChange={(e) => updateDelivery(d.id, { status: e.target.value })}
                    className="text-xs bg-muted rounded-lg px-2 py-1"
                  >
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button onClick={() => deleteDelivery(d.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW */}
      {sub === "new" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Truck size={16} className="text-primary" /> Solicitar entrega
          </h3>

          <div>
            <label className="text-xs font-bold text-foreground">Parceiro</label>
            <select value={partnerId} onChange={(e) => onPartnerChange(e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1">
              <option value="">— Selecione ou digite manualmente —</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
            </select>
          </div>

          <Field label="Nome da loja" value={partnerName} onChange={setPartnerName} />
          <Field label="Pedido / produto" value={orderDesc} onChange={setOrderDesc} />
          <Field label="Endereço de entrega" value={address} onChange={setAddress} />
          <Field label="Observações (opcional)" value={notes} onChange={setNotes} />

          <div className="grid grid-cols-2 gap-2">
            <NumField label="Taxa (R$)" value={fee} onChange={setFee} />
            <NumField label="Entregador (R$)" value={payout} onChange={setPayout} />
          </div>

          <div className="bg-primary/5 rounded-xl p-3 text-xs">
            <p className="font-bold text-foreground">Resumo</p>
            <p className="text-muted-foreground">Cobrado do cliente: <b className="text-foreground">R$ {fee.toFixed(2)}</b></p>
            <p className="text-muted-foreground">Pago ao entregador: <b className="text-foreground">R$ {payout.toFixed(2)}</b></p>
            <p className="text-primary font-bold">Margem: R$ {(fee - payout).toFixed(2)}</p>
          </div>

          <button onClick={createDelivery} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform">
            Criar entrega
          </button>
        </div>
      )}

      {/* COURIERS */}
      {sub === "couriers" && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-black text-foreground">Cadastrar entregador</h3>
            <Field label="Nome" value={cName} onChange={setCName} />
            <Field label="Telefone" value={cPhone} onChange={setCPhone} />
            <div>
              <label className="text-xs font-bold text-foreground">Veículo</label>
              <select value={cVehicle} onChange={(e) => setCVehicle(e.target.value)} className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1">
                <option value="moto">Moto</option>
                <option value="bike">Bike</option>
                <option value="carro">Carro</option>
              </select>
            </div>
            <button onClick={createCourier} className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl active:scale-95 transition-transform">
              Cadastrar
            </button>
          </div>

          {couriers.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${c.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {vehicleIcon(c.vehicle)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {c.phone}</p>
                {c.access_pin && (
                  <p className="text-[10px] text-muted-foreground">
                    PIN: <span className="font-black text-primary tracking-widest">{c.access_pin}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleCourier(c.id, c.is_active)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${c.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
              >
                {c.is_active ? "Ativo" : "Inativo"}
              </button>
              <button onClick={() => deleteCourier(c.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {couriers.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Nenhum entregador cadastrado 🛵</p>}
        </div>
      )}

      {/* SETTINGS */}
      {sub === "settings" && settings && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <DollarSign size={16} className="text-primary" /> Taxa padrão
          </h3>
          <NumField
            label="Taxa cobrada (R$)"
            value={Number(settings.default_fee)}
            onChange={(v) => setSettings({ ...settings, default_fee: v })}
          />
          <NumField
            label="Pagamento ao entregador (R$)"
            value={Number(settings.default_courier_payout)}
            onChange={(v) => setSettings({ ...settings, default_courier_payout: v })}
          />
          <div className="bg-primary/5 rounded-xl p-3 text-xs">
            <p className="text-primary font-black">Margem por entrega: R$ {margin.toFixed(2)}</p>
          </div>
          <button onClick={saveSettings} className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl active:scale-95 transition-transform">
            Salvar
          </button>
        </div>
      )}
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

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
      />
    </div>
  );
}
