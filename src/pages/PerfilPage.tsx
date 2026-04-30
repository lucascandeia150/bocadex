import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, MessageCircle, Info, Save, CheckCircle2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => { setSaved(false); }, [name, phone]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name: name.trim(), phone: phone.trim(), email: user.email })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar"); return; }
    await refreshProfile();
    setSaved(true);
    toast.success("Perfil salvo!");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da conta");
    navigate("/");
  };

  const displayName = (name || profile?.name || "").trim();
  const initial = (displayName[0] ?? user?.email?.[0] ?? "👤").toUpperCase();

  if (!loading && !user) {
    return (
      <div className="px-4 pt-12 pb-32 max-w-sm mx-auto text-center animate-slide-up">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl mb-3 shadow-lg">
          👤
        </div>
        <h1 className="text-xl font-black text-foreground">Sua conta EscolheAí</h1>
        <p className="text-xs text-muted-foreground mt-1 mb-5">
          Entre pra pedir, acompanhar status em tempo real e ver histórico completo
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow"
        >
          <LogIn size={16} /> Entrar
        </button>
        <button
          onClick={() => navigate("/auth?mode=signup")}
          className="w-full mt-2 bg-card border-2 border-border text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-all text-sm"
        >
          Criar conta
        </button>
      </div>
    );
  }

  const shortcuts = [
    {
      label: "Meus pedidos",
      desc: "Carrinho e histórico",
      icon: Package,
      onClick: () => navigate("/pedidos?tab=historico"),
    },
    {
      label: "Suporte",
      desc: "Fale com a gente",
      icon: MessageCircle,
      onClick: () => navigate("/contato"),
    },
    {
      label: "Sobre o app",
      desc: "EscolheAí",
      icon: Info,
      onClick: () => navigate("/sobre"),
    },
  ];

  return (
    <div className="px-4 pt-6 pb-32 max-w-sm mx-auto">
      <div className="text-center mb-5 animate-bounce-in">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-black shadow-lg mb-2">
          {initial}
        </div>
        <h1 className="text-xl font-black text-foreground">
          {displayName || "Seu perfil"}
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          {user?.email}
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-slide-up">
        <div className="flex items-center gap-2">
          <User size={16} className="text-primary" />
          <p className="text-xs font-bold text-foreground">Seus dados</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João da Silva"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">
            Telefone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(33) 9..."
            inputMode="tel"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow"
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar perfil"}
        </button>
        <p className="text-[10px] text-center text-muted-foreground">
          Seus dados ficam vinculados à sua conta.
        </p>
      </div>

      {/* Shortcuts */}
      <div className="mt-5 space-y-2">
        <p className="text-[11px] font-black text-muted-foreground uppercase px-1">Atalhos</p>
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.onClick}
              className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:scale-[0.98] transition-transform hover:border-primary/40"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            </button>
          );
        })}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-left active:scale-[0.98] transition-transform mt-3"
        >
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <LogOut size={16} className="text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-destructive">Sair da conta</p>
            <p className="text-[11px] text-muted-foreground">Encerrar sessão neste aparelho</p>
          </div>
        </button>
      </div>
    </div>
  );
}