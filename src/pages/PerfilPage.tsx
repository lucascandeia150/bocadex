import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Package, MessageCircle, Info, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  name: string;
  phone: string;
}

const STORAGE_KEY = "escolheai_profile";

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { name: "", phone: "" };
}

export default function PerfilPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [profile.name, profile.phone]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
      toast.success("Perfil salvo!");
    } catch {
      toast.error("Não foi possível salvar");
    }
  };

  const initial = (profile.name.trim()[0] ?? "👤").toUpperCase();

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
          {profile.name.trim() || "Seu perfil"}
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          {profile.phone.trim() || "Salve seus dados para pedir mais rápido"}
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
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ex: João da Silva"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">
            Telefone
          </label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="(33) 9..."
            inputMode="tel"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow"
        >
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? "Salvo!" : "Salvar perfil"}
        </button>
        <p className="text-[10px] text-center text-muted-foreground">
          Os dados ficam salvos só no seu aparelho.
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
      </div>
    </div>
  );
}