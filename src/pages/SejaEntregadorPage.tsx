import { useEffect, useState } from "react";
import { Send, Bike, Car, Truck, Info, LogOut } from "lucide-react";
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

const authSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

export default function SejaEntregadorPage() {
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | "pendente" | "aprovado" | "recusado">(null);
  const [form, setForm] = useState({
    full_name: "", phone: "", city_neighborhood: "",
    transport_type: "Moto" as "Moto" | "Bike" | "Carro",
    availability: "Integral" as "Manhã" | "Tarde" | "Noite" | "Integral",
    has_experience: false, service_area: "", average_fee: "", notes: "",
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserEmail(s?.user?.email || null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email || null);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Carrega cadastro existente do usuário logado
  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("courier_applications").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setDone(data.status as "pendente" | "aprovado" | "recusado");
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          city_neighborhood: data.city_neighborhood || "",
          transport_type: (data.transport_type as "Moto"|"Bike"|"Carro") || "Moto",
          availability: (data.availability as "Manhã"|"Tarde"|"Noite"|"Integral") || "Integral",
          has_experience: !!data.has_experience,
          service_area: data.service_area || "",
          average_fee: data.average_fee != null ? String(data.average_fee) : "",
          notes: data.notes || "",
        });
      }
    })();
  }, [userEmail]);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = authSchema.safeParse(authForm);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setAuthLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: authForm.email.trim(),
        password: authForm.password,
        options: { emailRedirectTo: `${window.location.origin}/seja-entregador` },
      });
      if (error) { toast.error(error.message); setAuthLoading(false); return; }
      toast.success("Conta criada! Agora preencha seu cadastro 🚀");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email.trim(), password: authForm.password,
      });
      if (error) { toast.error(error.message); setAuthLoading(false); return; }
      toast.success("Bem-vindo de volta! 🎉");
    }
    setAuthLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const fee = form.average_fee ? Number(form.average_fee.replace(",", ".")) : null;
    const { error } = await supabase.rpc("courier_submit_application", {
      _full_name: form.full_name.trim(),
      _phone: form.phone.trim(),
      _city_neighborhood: form.city_neighborhood.trim(),
      _transport_type: form.transport_type,
      _availability: form.availability,
      _has_experience: form.has_experience,
      _service_area: form.service_area.trim(),
      _average_fee: fee && !isNaN(fee) ? fee : null,
      _notes: form.notes?.trim() || "",
    });
    setLoading(false);
    if (error) { toast.error(error.message || "Erro ao enviar cadastro"); return; }
    trackAnalyticsEvent("form_submit", { form: "courier_application" });
    setDone("pendente");
    toast.success("Cadastro enviado! Aguarde aprovação ✅");
  };

  const logout = async () => { await supabase.auth.signOut(); setDone(null); };

  if (!authReady) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Carregando...</div>;
  }

  // Tela 1: precisa logar/cadastrar
  if (!userEmail) {
    return (
      <div className="px-4 pt-8 pb-12 max-w-md mx-auto space-y-5 animate-slide-up">
        <div className="text-center space-y-2">
          <span className="text-5xl block">🚚</span>
          <h1 className="text-2xl font-black text-foreground">Trabalhe como entregador 🚀</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signup" ? "Crie sua conta para começar o cadastro" : "Entre com seu email e senha"}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${mode === "signup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Criar conta
          </button>
          <button onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold ${mode === "signin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            Já tenho conta
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-3">
          <Field label="Email *">
            <input type="email" value={authForm.email}
              onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
              className={inp} placeholder="seu@email.com" autoComplete="email" />
          </Field>
          <Field label="Senha *">
            <input type="password" value={authForm.password}
              onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
              className={inp} placeholder="Mínimo 6 caracteres"
              autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </Field>
          <button type="submit" disabled={authLoading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
            {authLoading ? "Aguarde..." : (mode === "signup" ? "Criar conta e continuar" : "Entrar")}
          </button>
        </form>
      </div>
    );
  }

  // Tela 2: status do cadastro
  if (done === "aprovado") {
    return (
      <div className="px-4 pt-10 pb-12 max-w-md mx-auto text-center space-y-4 animate-bounce-in">
        <span className="text-6xl block">🎉</span>
        <h1 className="text-2xl font-black text-foreground">Cadastro aprovado!</h1>
        <p className="text-sm text-muted-foreground">
          Você já pode entrar no portal e começar a aceitar entregas.
        </p>
        <a href="/portal/entregador" className="inline-block mt-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          Abrir portal do entregador
        </a>
        <div><button onClick={logout} className="text-xs text-muted-foreground underline">Sair</button></div>
      </div>
    );
  }
  if (done === "pendente") {
    return (
      <div className="px-4 pt-10 pb-12 max-w-md mx-auto text-center space-y-4 animate-bounce-in">
        <span className="text-6xl block">⏳</span>
        <h1 className="text-2xl font-black text-foreground">Aguardando aprovação</h1>
        <p className="text-sm text-muted-foreground">
          Seu cadastro foi recebido. Em breve entraremos em contato pelo WhatsApp <strong>{form.phone}</strong>.
        </p>
        <button onClick={() => setDone(null)} className="text-xs text-muted-foreground underline">Editar cadastro</button>
        <div><button onClick={logout} className="text-xs text-destructive underline">Sair</button></div>
      </div>
    );
  }
  if (done === "recusado") {
    return (
      <div className="px-4 pt-10 pb-12 max-w-md mx-auto text-center space-y-4">
        <span className="text-6xl block">😕</span>
        <h1 className="text-2xl font-black text-foreground">Cadastro não aprovado</h1>
        <p className="text-sm text-muted-foreground">
          Você pode revisar seus dados e enviar novamente.
        </p>
        <button onClick={() => setDone(null)} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          Editar e reenviar
        </button>
        <div><button onClick={logout} className="text-xs text-muted-foreground underline">Sair</button></div>
      </div>
    );
  }

  // Tela 3: formulário
  return (
    <div className="px-4 pt-6 pb-12 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground truncate">👤 {userEmail}</p>
        <button onClick={logout} className="text-xs text-destructive flex items-center gap-1">
          <LogOut size={12} /> Sair
        </button>
      </div>

      <div className="text-center space-y-2 animate-bounce-in">
        <span className="text-5xl block">🚚</span>
        <h1 className="text-2xl font-black text-foreground">Complete seu cadastro</h1>
        <p className="text-sm text-muted-foreground">Receba oportunidades de entrega</p>
      </div>

      <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-3 flex gap-2 items-start">
        <Info size={16} className="text-secondary mt-0.5 shrink-0" />
        <p className="text-xs text-foreground leading-relaxed">
          💡 O valor da entrega é combinado <strong>diretamente entre a loja e o entregador</strong>.
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
