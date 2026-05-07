import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, KeyRound, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

function evalStrength(pwd: string) {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (/[A-Za-z]/.test(pwd) && /\d/.test(pwd)) s++;
  if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) s++;
  if (!pwd) return { label: "", color: "bg-muted", pct: 0, score: 0 };
  if (s <= 1) return { label: "Fraca", color: "bg-destructive", pct: 33, score: 1 };
  if (s === 2) return { label: "Média", color: "bg-yellow-500", pct: 66, score: 2 };
  return { label: "Forte", color: "bg-green-500", pct: 100, score: 3 };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Quando o usuário chega pelo link de recuperação, o Supabase dispara
    // um evento PASSWORD_RECOVERY com sessão temporária.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(!!session);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const strength = evalStrength(password);
  const matches = password.length > 0 && password === confirm;

  const handleSave = async () => {
    const parsed = z.string().min(6, "Senha mínima de 6 caracteres").max(72).safeParse(password);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (strength.score < 2) { toast.error("Sua senha está muito fraca. Use letras e números."); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) { toast.error(error.message || "Não foi possível alterar a senha."); return; }
    toast.success("Senha alterada com sucesso ✅");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (!ready) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="px-4 pt-8 pb-32 max-w-sm mx-auto animate-slide-up">
      <button
        onClick={() => navigate("/auth")}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-lg">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-bounce-in">
            <KeyRound className="text-primary" size={32} />
          </div>
          <h2 className="text-xl font-black text-foreground">Criar nova senha</h2>
          <p className="text-xs text-muted-foreground">
            Escolha uma senha forte que você não usa em outros sites.
          </p>
        </div>

        {!hasSession ? (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-center space-y-2">
            <p className="text-sm font-bold text-destructive">Link inválido ou expirado</p>
            <p className="text-xs text-muted-foreground">
              Solicite um novo link de recuperação na tela de login.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Ir para login
            </button>
          </div>
        ) : (
          <>
            <PasswordField
              label="Nova senha"
              value={password}
              onChange={setPassword}
              show={show}
              setShow={setShow}
            />

            {password.length > 0 && (
              <div className="space-y-1.5 -mt-2">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${strength.pct}%` }} />
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

            <PasswordField
              label="Confirmar nova senha"
              value={confirm}
              onChange={setConfirm}
              show={show}
              setShow={setShow}
            />

            {confirm.length > 0 && (
              <p className={`text-[10px] flex items-center gap-1 -mt-2 ${matches ? "text-green-600" : "text-destructive"}`}>
                {matches ? <Check size={11} /> : <X size={11} />}
                {matches ? "As senhas coincidem" : "As senhas não coincidem"}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={busy}
              className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-60"
            >
              {busy ? "Salvando..." : "Salvar nova senha"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label, value, onChange, show, setShow,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (fn: (v: boolean) => boolean) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background">
        <Lock size={14} className="text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Mín. 6 caracteres"
          className="flex-1 bg-transparent outline-none text-sm text-foreground"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}