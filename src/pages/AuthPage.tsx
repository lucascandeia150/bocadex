import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Phone, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
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

// Mapeia erros (Supabase + códigos estilo Firebase) para mensagens amigáveis em PT-BR
function friendlyAuthError(err: unknown): string {
  const raw = (err as { message?: string; code?: string } | null);
  const msg = (raw?.message || "").toLowerCase();
  const code = (raw?.code || "").toLowerCase();

  if (code.includes("weak-password") || msg.includes("weak") || msg.includes("password is known"))
    return "Sua senha está muito fraca. Use pelo menos 6 caracteres com letras e números.";
  if (code.includes("email-already-in-use") || msg.includes("already registered") || msg.includes("already") || msg.includes("user already"))
    return "Este email já está cadastrado.";
  if (code.includes("invalid-email") || msg.includes("invalid email") || msg.includes("invalid format"))
    return "Digite um email válido.";
  if (code.includes("network-request-failed") || msg.includes("network") || msg.includes("failed to fetch"))
    return "Sem conexão com a internet.";
  if (code.includes("too-many-requests") || msg.includes("rate limit") || msg.includes("too many"))
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  if (msg.includes("invalid login") || msg.includes("invalid credentials"))
    return "Email ou senha inválidos.";
  if (msg.includes("password should be at least") || msg.includes("password is too short"))
    return "Sua senha está muito curta. Use pelo menos 6 caracteres.";
  return raw?.message || "Não foi possível concluir. Tente novamente.";
}

type Strength = { score: 0 | 1 | 2 | 3; label: string; color: string; pct: number };
function evaluateStrength(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (/[A-Za-z]/.test(pwd) && /\d/.test(pwd)) score++;
  if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) score++;
  if (!pwd) return { score: 0, label: "", color: "bg-muted", pct: 0 };
  if (score <= 1) return { score: 1, label: "Fraca", color: "bg-destructive", pct: 33 };
  if (score === 2) return { score: 2, label: "Média", color: "bg-yellow-500", pct: 66 };
  return { score: 3, label: "Forte", color: "bg-green-500", pct: 100 };
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);

  const redirectTo = params.get("redirect") || "/";

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  const strength = evaluateStrength(password);
  const pwdInvalid = tab === "signup" && pwdTouched && password.length > 0 && password.length < 6;

  const handleSignUp = async () => {
    const parsed = signUpSchema.safeParse({ name, phone, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (strength.score < 2) {
      toast.error("Sua senha está muito fraca. Use letras e números (mín. 6 caracteres).");
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
      toast.error(friendlyAuthError(error));
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
      toast.error(friendlyAuthError(error));
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
        <h1 className="text-2xl font-black text-foreground">Bocadex Delivery's</h1>
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
        <div>
          <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Senha</label>
          <div
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-background transition-colors ${
              pwdInvalid ? "border-destructive ring-1 ring-destructive/30" : "border-border"
            }`}
          >
            <Lock size={14} className="text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPwdTouched(true)}
              placeholder="Mín. 6 caracteres"
              className="flex-1 bg-transparent outline-none text-sm text-foreground"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {tab === "signup" && password.length > 0 && (
            <div className="mt-2 space-y-1.5 animate-slide-up">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300 ease-out`}
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-muted-foreground">
                  Força: <span className="text-foreground">{strength.label}</span>
                </span>
                <span className={`flex items-center gap-1 ${password.length >= 6 ? "text-green-600" : "text-muted-foreground"}`}>
                  {password.length >= 6 ? <Check size={11} /> : <X size={11} />} 6+ caracteres
                </span>
              </div>
            </div>
          )}

          {pwdInvalid && (
            <p className="text-[10px] text-destructive mt-1 animate-slide-up">
              A senha precisa ter pelo menos 6 caracteres.
            </p>
          )}
        </div>

        <button
          disabled={busy}
          onClick={tab === "signin" ? handleSignIn : handleSignUp}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-60 mt-1"
        >
          {busy ? "Aguarde..." : tab === "signin" ? "Entrar" : "Criar conta"}
        </button>

        <p className="text-[10px] text-center text-muted-foreground pt-1">
          Ao continuar você aceita os termos do Bocadex Delivery's.
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