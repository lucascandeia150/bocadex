import { useState } from "react";
import { CheckCircle, Rocket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

const benefits = [
  "Sua loja na home do Bocadex Delivery's",
  "Pedidos via WhatsApp ou pelo app",
  "Divulgação nas redes sociais",
  "Painel para gerenciar produtos",
];

const CATEGORIES = [
  "Hambúrguer", "Pizza", "Marmitex", "Salgados",
  "Doces", "Bebidas", "Açaí", "Mercado", "Farmácia", "Outros",
];

export default function SejaParceiroPage() {
  const [step, setStep] = useState<"form" | "paying">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    business_type: "Hambúrguer",
    description: "",
    address: "",
    whatsapp: "",
    owner_name: "",
    logo_url: "",
    uses_app_courier: false,
  });

  const upd = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.whatsapp.trim() || !form.address.trim()) {
      toast.error("Preencha nome, WhatsApp e endereço.");
      return;
    }
    setLoading(true);
    try {
      trackAnalyticsEvent("partner_application_submit", { source: "seja_parceiro_page" });

      const { data: partner, error } = await supabase.rpc("submit_partner_application", {
        _business_name: form.business_name.trim(),
        _business_type: form.business_type,
        _description: form.description.trim(),
        _address: form.address.trim(),
        _whatsapp: form.whatsapp.trim(),
        _logo_url: form.logo_url.trim() || null,
        _owner_name: form.owner_name.trim() || null,
        _uses_app_courier: form.uses_app_courier,
      });
      if (error) throw new Error(error.message);
      const partnerRow = Array.isArray(partner) ? partner[0] : partner;
      if (!partnerRow?.id) throw new Error("Não foi possível salvar o cadastro.");

      setStep("paying");

      const backUrl = `${window.location.origin}/pagamento/retorno?type=partner&partner_id=${partnerRow.id}`;
      const { data: pref, error: payErr } = await supabase.functions.invoke("partner-subscribe", {
        body: { partner_id: partnerRow.id, back_url: backUrl },
      });
      if (payErr) throw new Error(payErr.message);
      const initPoint = (pref as { init_point?: string })?.init_point;
      if (!initPoint) throw new Error("Checkout indisponível. Tente novamente.");

      window.location.href = initPoint;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao processar cadastro");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-12 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2 animate-bounce-in">
        <span className="text-5xl block">🚀</span>
        <h1 className="text-2xl font-black text-foreground">Seja parceiro do Bocadex Delivery's</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cadastre sua loja em 2 minutos e comece a receber pedidos hoje mesmo.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-2.5 animate-slide-up">
        {benefits.map((b) => (
          <div key={b} className="flex items-start gap-2.5">
            <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
            <span className="text-sm font-semibold text-foreground">{b}</span>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-secondary/15 to-primary/15 border-2 border-secondary/40 rounded-2xl p-4 text-center animate-slide-up">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Plano mensal</p>
        <p className="text-3xl font-black text-secondary mt-1">
          R$ 9,90<span className="text-sm font-bold text-muted-foreground">/mês</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">Pague via PIX ou cartão. Cancele quando quiser.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Dados da loja</h2>

        <Field label="Nome da loja *" value={form.business_name} onChange={(v) => upd("business_name", v)} placeholder="Ex: Burger do João" />

        <div>
          <label className="text-xs font-bold text-foreground mb-1 block">Categoria *</label>
          <select
            value={form.business_type}
            onChange={(e) => upd("business_type", e.target.value)}
            className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm font-semibold"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <Field label="Descrição curta" value={form.description} onChange={(v) => upd("description", v)} placeholder="Ex: Burgers artesanais e batatas crocantes" textarea />
        <Field label="Endereço *" value={form.address} onChange={(v) => upd("address", v)} placeholder="Rua, número, bairro" />
        <Field label="WhatsApp *" value={form.whatsapp} onChange={(v) => upd("whatsapp", v)} placeholder="55339..." />
        <Field label="Seu nome" value={form.owner_name} onChange={(v) => upd("owner_name", v)} placeholder="Responsável pela loja" />
        <Field label="Logo (URL)" value={form.logo_url} onChange={(v) => upd("logo_url", v)} placeholder="https://..." />

        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card cursor-pointer">
          <input
            type="checkbox"
            checked={form.uses_app_courier}
            onChange={(e) => upd("uses_app_courier", e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-semibold text-foreground">Quero usar entregadores do app</span>
        </label>

        <button
          type="submit"
          disabled={loading || step === "paying"}
          className="w-full gradient-primary text-primary-foreground font-black text-base py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading || step === "paying" ? (
            <><Loader2 size={20} className="animate-spin" /> Abrindo checkout...</>
          ) : (
            <><Rocket size={20} /> Cadastrar e pagar R$ 9,90</>
          )}
        </button>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Pagamento seguro pelo Mercado Pago. Sua loja é ativada automaticamente assim que o pagamento for aprovado.
        </p>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground mb-1 block">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm"
        />
      )}
    </div>
  );
}
