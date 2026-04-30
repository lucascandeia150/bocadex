import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Phone, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(120),
  password: z.string().min(6, "Senha mínima de 6 caracteres").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">((params.get("mode") === "signup" ? "signup" : "signin"));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTo = params.get("redirect") || "/";

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  const handleSignUp = async () => {
    const parsed = signUpSchema.safeParse({ name, phone, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { name: parsed.data.name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Email já cadastrado" : error.message);
      return;
    }
    toast.success("Conta criada! Você já está logado.");
  };

  const handleSignIn = async () => {
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error("Email ou senha inválidos");
      return;
    }
    toast.success("Login realizado ✅");
  };

  return (
    <div className="px-4 pt-6 pb-32 max-w-sm mx-auto">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <div className="text-center mb-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl mb-2 shadow-lg">
          🍔
        </div>
        <h1 className="text-2xl font-black text-foreground">EscolheAí</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tab === "signin" ? "Entre pra pedir e acompanhar tudo" : "Crie sua conta em 30 segundos"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-muted rounded-2xl p-1 mb-4">
        <button
          onClick={() => setTab("signin")}
          className={`py-2 rounded-xl text-xs font-black transition-all ${tab === "signin" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
        >
          Entrar
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`py-2 rounded-xl text-xs font-black transition-all ${tab === "signup" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
        >
          Criar conta
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-slide-up">
        {tab === "signup" && (
          <>
            <FieldIcon icon={<UserIcon size={14} />} label="Nome" placeholder="Ex: João da Silva" value={name} onChange={setName} />
            <FieldIcon icon={<Phone size={14} />} label="Telefone" placeholder="(33) 9..." value={phone} onChange={setPhone} type="tel" />
          </>
        )}
        <FieldIcon icon={<Mail size={14} />} label="Email" placeholder="seu@email.com" value={email} onChange={setEmail} type="email" />
        <FieldIcon icon={<Lock size={14} />} label="Senha" placeholder="Mín. 6 caracteres" value={password} onChange={setPassword} type="password" />

        <button
          disabled={busy}
          onClick={tab === "signin" ? handleSignIn : handleSignUp}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-60 mt-1"
        >
          {busy ? "Aguarde..." : tab === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <p className="text-[10px] text-center text-muted-foreground pt-1">
          Ao continuar você aceita os termos do EscolheAí.
        </p>
      </div>
    </div>
  );
}

function FieldIcon({
  icon, label, value, onChange, placeholder, type = "text",
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-foreground"
        />
      </div>
    </div>
  );
}