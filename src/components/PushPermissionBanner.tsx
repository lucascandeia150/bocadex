import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPushSupported, registerPush } from "@/lib/push";
import { toast } from "sonner";

const DISMISS_UNTIL_KEY = "push_banner_dismissed_until";
const DISMISS_HOURS = 24;

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const until = Number(localStorage.getItem(DISMISS_UNTIL_KEY) || 0);
      if (until && Date.now() < until) return;
      if (!(await isPushSupported())) return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "default") return;
      if (!cancelled) setShow(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!show) return null;

  const snooze = () => {
    localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + DISMISS_HOURS * 3600 * 1000));
    setShow(false);
  };

  const enable = async () => {
    setBusy(true);
    const r = await registerPush();
    setBusy(false);
    setShow(false);
    if (r.ok) {
      localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + 365 * 86400000));
      toast.success("Notificações ativadas! 🔔");
    } else if (r.reason === "denied") {
      snooze();
      toast.error("Permissão negada — pediremos novamente em 24h");
    } else {
      snooze();
    }
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Ativar notificações"
      className="sticky top-14 z-40 mx-3 mt-2 bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-4"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Bell size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground leading-tight">Ativar notificações</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          Receba avisos de pedidos e novidades.
        </p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black active:scale-95 transition-transform disabled:opacity-60"
      >
        {busy ? "..." : "Ativar"}
      </button>
      <button
        onClick={snooze}
        aria-label="Fechar"
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}