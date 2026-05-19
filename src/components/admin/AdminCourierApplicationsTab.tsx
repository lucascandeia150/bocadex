import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, RefreshCw, CheckCircle, XCircle, Clock, Phone, Mail, MessageCircle, KeyRound } from "lucide-react";

interface CourierApp {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  user_id: string | null;
  city_neighborhood: string;
  transport_type: string;
  availability: string;
  has_experience: boolean;
  service_area: string;
  average_fee: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-600",
  aprovado: "bg-green-500/10 text-green-600",
  recusado: "bg-destructive/10 text-destructive",
};

export default function AdminCourierApplicationsTab() {
  const [items, setItems] = useState<CourierApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendente" | "aprovado" | "recusado">("todos");
  const [pinByApp, setPinByApp] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courier_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar");
    else setItems((data as CourierApp[]) || []);
    // Carrega PINs dos couriers aprovados (via função segura para admins)
    const { data: cs } = await supabase.rpc("admin_all_courier_pins_by_application");
    const map: Record<string, string> = {};
    (cs as { application_id: string; access_pin: string | null }[] | null || [])
      .forEach((c) => { if (c.application_id && c.access_pin) map[c.application_id] = c.access_pin; });
    setPinByApp(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { data, error } = await supabase.rpc("admin_approve_courier", { _application_id: id });
    if (error) { toast.error(error.message || "Erro ao aprovar"); return; }
    toast.success("Aprovado ✅ PIN gerado");
    const pin = (data as any)?.access_pin;
    if (pin) setPinByApp((p) => ({ ...p, [id]: pin }));
    setItems((p) => p.map((i) => i.id === id ? { ...i, status: "aprovado" } : i));
  };

  const reject = async (id: string) => {
    if (!confirm("Recusar este cadastro?")) return;
    const { error } = await supabase.rpc("admin_reject_courier", { _application_id: id });
    if (error) { toast.error(error.message || "Erro"); return; }
    setItems((p) => p.map((i) => i.id === id ? { ...i, status: "recusado" } : i));
    toast.success("Recusado");
  };

  const setPending = async (id: string) => {
    const { error } = await supabase.from("courier_applications").update({ status: "pendente" }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setItems((p) => p.map((i) => i.id === id ? { ...i, status: "pendente" } : i));
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este cadastro?")) return;
    const { error } = await supabase.from("courier_applications").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setItems((p) => p.filter((i) => i.id !== id));
    toast.success("Removido");
  };

  const filtered = items.filter((i) => filter === "todos" || i.status === filter);

  const waLink = (c: CourierApp) => {
    const phone = c.phone.replace(/\D/g, "");
    const pin = pinByApp[c.id];
    const msg = c.status === "aprovado" && pin
      ? `🚀 Olá ${c.full_name}! Seu cadastro de entregador foi APROVADO no Bocadex Delivery's!\n\n🔐 Seu PIN: ${pin}\n\nAcesse: https://escolheai.today/portal/entregador\n\n👉 Faça login com seu email (${c.email || "—"}) e senha cadastrados ou use o PIN acima.\n\nBoas entregas! 🛵`
      : c.status === "recusado"
      ? `Olá ${c.full_name}, infelizmente não pudemos aprovar seu cadastro no Bocadex Delivery's no momento. Qualquer dúvida estamos à disposição.`
      : `Olá ${c.full_name}! Recebemos seu cadastro de entregador no Bocadex Delivery's e estamos analisando. Em breve retornaremos.`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">Entregadores ({items.length})</h2>
        <button onClick={load} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {(["todos", "pendente", "aprovado", "recusado"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum cadastro 🚚</p>
      )}

      {filtered.map((c) => (
        <div key={c.id} className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black text-foreground">{c.full_name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone size={10} /> {c.phone} • {c.city_neighborhood}
              </p>
              {c.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail size={10} /> {c.email}
                </p>
              )}
              {c.status === "aprovado" && pinByApp[c.id] && (
                <p className="text-xs text-primary flex items-center gap-1 mt-0.5 font-bold">
                  <KeyRound size={10} /> PIN: {pinByApp[c.id]}
                </p>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[c.status] || "bg-muted"}`}>
              {c.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Info label="Transporte" value={c.transport_type} />
            <Info label="Disponibilidade" value={c.availability} />
            <Info label="Experiência" value={c.has_experience ? "Sim" : "Não"} />
            <Info label="Valor médio" value={c.average_fee ? `R$ ${Number(c.average_fee).toFixed(2)}` : "—"} />
          </div>
          <Info label="Área" value={c.service_area} />
          {c.notes && <Info label="Obs" value={c.notes} />}

          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock size={10} /> {new Date(c.created_at).toLocaleString("pt-BR")}
          </p>

          <div className="flex gap-1 pt-1">
            <button onClick={() => approve(c.id)} disabled={c.status === "aprovado"}
              className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold flex items-center justify-center gap-1">
              <CheckCircle size={12} /> Aprovar
            </button>
            <button onClick={() => reject(c.id)} disabled={c.status === "recusado"}
              className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center gap-1">
              <XCircle size={12} /> Recusar
            </button>
            <button onClick={() => setPending(c.id)} disabled={c.status === "pendente"}
              className="flex-1 py-2 rounded-xl bg-yellow-500/10 text-yellow-600 text-xs font-bold">
              Pendente
            </button>
            <button onClick={() => remove(c.id)} className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <Trash2 size={12} />
            </button>
          </div>

          <a href={waLink(c)} target="_blank" rel="noreferrer"
            className="block text-center py-2 rounded-xl bg-green-500/10 text-green-600 text-xs font-bold">
            <MessageCircle size={12} className="inline mr-1" />
            {c.status === "aprovado" ? "Enviar PIN por WhatsApp" : "Abrir WhatsApp"}
          </a>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg px-2 py-1">
      <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
      <p className="text-[11px] font-semibold text-foreground break-words">{value}</p>
    </div>
  );
}
