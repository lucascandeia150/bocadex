import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Plus, RefreshCw, MapPin, Truck, ArrowLeft, LogOut } from "lucide-react";

interface Partner {
  id: string;
  business_name: string;
  address: string;
  whatsapp: string;
  uses_app_courier?: boolean;
}

interface Delivery {
  id: string;
  partner_name: string;
  order_description: string;
  delivery_address: string;
  notes: string | null;
  fee: number;
  status: string;
  courier_id: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  disponivel: { label: "Aguardando entregador", color: "bg-blue-500/10 text-blue-600" },
  aceita: { label: "Aceita", color: "bg-yellow-500/10 text-yellow-600" },
  em_andamento: { label: "Em andamento", color: "bg-orange-500/10 text-orange-600" },
  concluida: { label: "Finalizado", color: "bg-green-500/10 text-green-600" },
  cancelada: { label: "Cancelada", color: "bg-red-500/10 text-red-600" },
};

const PIN_KEY = "escolheai_partner_pin";

export default function PortalLojaPage() {
  const [pin, setPin] = useState("");
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"list" | "new">("list");

  // form
  const [orderDesc, setOrderDesc] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [orderValue, setOrderValue] = useState<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(PIN_KEY);
    if (saved) {
      setPin(saved);
      tryLogin(saved, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryLogin = async (code: string, silent = false) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_login", { _pin: code });
    setLoading(false);
    if (error || !data || data.length === 0) {
      if (!silent) toast.error("PIN inválido");
      localStorage.removeItem(PIN_KEY);
      setPartner(null);
      return;
    }
    const p = data[0] as Partner;
    // fetch uses_app_courier flag (not exposed by RPC)
    const { data: pa } = await supabase
      .from("partner_applications")
      .select("uses_app_courier")
      .eq("id", p.id)
      .maybeSingle();
    const merged = { ...p, uses_app_courier: !!pa?.uses_app_courier };
    setPartner(merged);
    setAddress(p.address);
    localStorage.setItem(PIN_KEY, code);
    loadDeliveries(code);
  };

  const loadDeliveries = async (code: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_list_deliveries", { _pin: code });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar pedidos"); return; }
    setDeliveries((data as Delivery[]) || []);
  };

  const logout = () => {
    localStorage.removeItem(PIN_KEY);
    setPartner(null);
    setPin("");
    setDeliveries([]);
  };

  const submit = async () => {
    if (!orderDesc.trim() || !address.trim()) {
      toast.error("Preencha pedido e endereço");
      return;
    }
    if (partner?.uses_app_courier && (!orderValue || orderValue <= 0)) {
      toast.error("Informe o valor do pedido (necessário para a taxa de 8%)");
      return;
    }
    if (partner?.uses_app_courier) {
      const ok = window.confirm(
        `Este pedido utilizará entregador parceiro.\n\nSerá aplicada taxa de 8% sobre o valor do pedido (R$ ${(orderValue * 0.08).toFixed(2)}).\n\nDeseja continuar?`
      );
      if (!ok) return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("partner_create_delivery", {
      _pin: pin,
      _order_description: orderDesc.trim(),
      _delivery_address: address.trim(),
      _notes: notes.trim(),
      _fee: fee,
      _order_value: orderValue,
    });
    setLoading(false);
    if (error) { toast.error("Erro ao enviar pedido"); return; }
    toast.success("Pedido enviado ✅");
    setOrderDesc(""); setNotes(""); setFee(0); setOrderValue(0);
    setAddress(partner?.address || "");
    setTab("list");
    loadDeliveries(pin);
  };

  if (!partner) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4 animate-slide-up">
        <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft size={14} /> Voltar
        </a>
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
          <Store className="mx-auto text-primary" size={40} />
          <h1 className="text-lg font-black text-foreground">Portal da Loja</h1>
          <p className="text-xs text-muted-foreground">Digite o PIN de 6 dígitos fornecido pelo administrador.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full text-center text-2xl font-black tracking-widest bg-muted rounded-xl px-3 py-3"
          />
          <button
            disabled={loading || pin.length !== 6}
            onClick={() => tryLogin(pin)}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Portal da loja</p>
          <h1 className="text-base font-black text-foreground">{partner.business_name}</h1>
        </div>
        <button onClick={logout} className="p-2 rounded-xl bg-destructive/10 text-destructive">
          <LogOut size={14} />
        </button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground">
        💡 O pagamento da entrega é combinado diretamente entre loja e entregador.
      </div>

      {partner.uses_app_courier && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-foreground">
          💡 Ao utilizar entregadores do app EscolheAí, será aplicada uma <b>taxa de 8%</b> sobre o valor do pedido.
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("list")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "list" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          📦 Meus pedidos
        </button>
        <button
          onClick={() => setTab("new")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold ${tab === "new" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Plus size={12} className="inline" /> Novo
        </button>
        <button onClick={() => loadDeliveries(pin)} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {tab === "new" && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <Field label="Pedido / produto" value={orderDesc} onChange={setOrderDesc} />
          <Field label="Endereço de entrega" value={address} onChange={setAddress} />
          <Field label="Observações (opcional)" value={notes} onChange={setNotes} />
          <NumField
            label={partner.uses_app_courier ? "Valor do pedido (R$) *" : "Valor do pedido (R$)"}
            value={orderValue}
            onChange={setOrderValue}
          />
          <NumField label="Valor da entrega (R$)" value={fee} onChange={setFee} />

          {partner.uses_app_courier && orderValue > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">Resumo</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Valor do pedido</span><b className="text-foreground">R$ {orderValue.toFixed(2)}</b>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa do app (8%)</span><b className="text-primary">R$ {(orderValue * 0.08).toFixed(2)}</b>
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-1">
                Apenas referência. A cobrança será feita posteriormente pelo app.
              </p>
            </div>
          )}

          <button
            disabled={loading}
            onClick={submit}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 disabled:opacity-50"
          >
            <Truck size={14} className="inline mr-1" /> Enviar pedido
          </button>
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-2">
          {deliveries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhum pedido ainda 📭</p>
          )}
          {deliveries.map((d) => {
            const s = STATUS_LABEL[d.status] || STATUS_LABEL.disponivel;
            return (
              <div key={d.id} className="bg-card rounded-2xl border border-border p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground flex-1">{d.order_description}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin size={10} className="mt-0.5 shrink-0" /> {d.delivery_address}
                </p>
                {d.notes && <p className="text-xs text-muted-foreground italic">"{d.notes}"</p>}
                <p className="text-xs text-foreground">Taxa: <b>R$ {Number(d.fee).toFixed(2)}</b></p>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-BR")}</p>
              </div>
            );
          })}
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
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
      />
    </div>
  );
}