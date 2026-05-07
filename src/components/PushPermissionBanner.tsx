import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPushSupported, registerPush } from "@/lib/push";
import { toast } from "sonner";

const KEY = "push_banner_dismissed_v1";

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      if (localStorage.getItem(KEY)) return;
      if (!(await isPushSupported())) return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "default") return;
      if (!cancelled) setShow(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!show) return null;

  const enable = async () => {
    setBusy(true);
    const r = await registerPush();
    setBusy(false);
    setShow(false);
    localStorage.setItem(KEY, "1");
    if (r.ok) toast.success("Notificações ativadas! 🔔");
    else if (r.reason === "denied") toast.error("Permissão negada");
  };

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Bell size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground">Ativar notificações</p>
        <p className="text-[11px] text-muted-foreground">Receba avisos de pedidos, promoções e novidades.</p>
      </div>
      <button onClick={enable} disabled={busy}
        className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black active:scale-95 transition-transform disabled:opacity-60">
        {busy ? "..." : "Ativar"}
      </button>
      <button onClick={dismiss} className="p-1 rounded hover:bg-muted">
        <X size={14} />
      </button>
    </div>
  );
}