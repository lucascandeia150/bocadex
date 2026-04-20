import { useState } from "react";
import { Rocket, Send, Bike, Car, Truck, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nome obrigatório").max(100),
  phone: z.string().trim().min(8, "Telefone obrigatório").max(20),
  city_neighborhood: z.string().trim().min(2, "Cidade/Bairro obrigatório").max(100),
  transport_type: z.enum(["Moto", "Bike", "Carro"]),
  availability: z.enum(["Manhã", "Tarde", "Noite", "Integral"]),
  has_experience: z.boolean(),
  service_area: z.string().trim().min(2, "Área obrigatória").max(150),
  average_fee: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export default function SejaEntregadorPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city_neighborhood: "",
    transport_type: "Moto" as "Moto" | "Bike" | "Carro",
    availability: "Integral" as "Manhã" | "Tarde" | "Noite" | "Integral",
    has_experience: false,
    service_area: "",
    average_fee: "",
    notes: "",
  });

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const fee = form.average_fee ? Number(form.average_fee.replace(",", ".")) : null;
    const { error } = await supabase.from("courier_applications").insert({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city_neighborhood: form.city_neighborhood.trim(),
      transport_type: form.transport_type,
      availability: form.availability,
      has_experience: form.has_experience,
      service_area: form.service_area.trim(),
      average_fee: fee && !isNaN(fee) ? fee : null,
      notes: form.notes?.trim() || "",
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar cadastro");
      return;
    }
    trackAnalyticsEvent("form_submit", { form: "courier_application" });
    setDone(true);
    toast.success("Cadastro enviado com sucesso! ✅");
  };

  if (done) {
    return (
      <div className="px-4 pt-10 pb-12 max-w-md mx-auto text-center space-y-4 animate-bounce-in">
        <span className="text-6xl block">🎉</span>
        <h1 className="text-2xl font-black text-foreground">Cadastro enviado!</h1>
        <p className="text-sm text-muted-foreground">
          Recebemos sua candidatura. Em breve entraremos em contato pelo WhatsApp informado.
        </p>
        <button
          onClick={() => { setDone(false); setForm({ ...form, full_name: "", phone: "", service_area: "", notes: "" }); }}
          className="mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          Enviar outro cadastro
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-12 max-w-md mx-auto space-y-5">
      <div className="text-center space-y-2 animate-bounce-in">
        <span className="text-5xl block">🚚</span>
        <h1 className="text-2xl font-black text-foreground">Trabalhe como entregador parceiro 🚀</h1>
        <p className="text-sm text-muted-foreground">
          Receba oportunidades de entrega de comércios locais
        </p>
      </div>

      <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-3 flex gap-2 items-start">
        <Info size={16} className="text-secondary mt-0.5 shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">
          💡 O valor da entrega é combinado <strong>diretamente entre a loja e o entregador parceiro</strong>. O app não processa pagamentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up">
        <Field label="Nome completo *">
          <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className={inp} placeholder="Seu nome" />
        </Field>

        <Field label="Telefone (WhatsApp) *">
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inp} placeholder="(33) 99999-9999" inputMode="tel" />
        </Field>

        <Field label="Cidade / Bairro *">
          <input value={form.city_neighborhood} onChange={(e) => update("city_neighborhood", e.target.value)} className={inp} placeholder="Ex: Centro - Teófilo Otoni" />
        </Field>

        <Field label="Tipo de transporte *">
          <div className="grid grid-cols-3 gap-2">
            {(["Moto", "Bike", "Carro"] as const).map((t) => {
              const Icon = t === "Moto" ? Truck : t === "Bike" ? Bike : Car;
              const active = form.transport_type === t;
              return (
                <button key={t} type="button" onClick={() => update("transport_type", t)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                  <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-xs font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{t}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Disponibilidade *">
          <select value={form.availability} onChange={(e) => update("availability", e.target.value)} className={inp}>
            <option>Manhã</option><option>Tarde</option><option>Noite</option><option>Integral</option>
          </select>
        </Field>

        <Field label="Possui experiência? *">
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => update("has_experience", v)}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.has_experience === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                {v ? "Sim" : "Não"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Área de atuação *">
          <input value={form.service_area} onChange={(e) => update("service_area", e.target.value)} className={inp} placeholder="Bairros que atende" />
        </Field>

        <Field label="Valor médio por entrega (opcional)">
          <input value={form.average_fee} onChange={(e) => update("average_fee", e.target.value)} className={inp} placeholder="R$ 8,00" inputMode="decimal" />
        </Field>

        <Field label="Observações">
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className={`${inp} min-h-[80px] resize-none`} placeholder="Algo que queira informar..." maxLength={500} />
        </Field>

        <button type="submit" disabled={loading}
          className="w-full mt-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
          {loading ? "Enviando..." : (<><Send size={16} /> Enviar cadastro</>)}
        </button>
      </form>
    </div>
  );
}

const inp = "w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
