import { useAppVersion } from "@/hooks/useAppVersion";
import { RefreshCw, Sparkles } from "lucide-react";

export default function ForceUpdateModal() {
  const { version } = useAppVersion();
  if (!version || !version.force_update) return null;

  const reload = () => {
    try { localStorage.setItem("escolheai_seen_version", version.version); } catch {}
    const w: Window = window;
    if ("caches" in w) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .finally(() => w.location.reload());
    } else {
      w.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Sparkles size={26} />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Versão {version.version}
          </p>
          <h2 className="text-lg font-black text-foreground mt-1">
            {version.title || "Atualização disponível"}
          </h2>
        </div>
        {version.changelog && (
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans text-left bg-muted rounded-xl p-3 max-h-40 overflow-auto">
            {version.changelog}
          </pre>
        )}
        <button
          onClick={reload}
          className="w-full bg-primary text-primary-foreground font-black py-3 rounded-xl active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} /> Atualizar agora
        </button>
        <p className="text-[10px] text-muted-foreground">Esta atualização é obrigatória para continuar.</p>
      </div>
    </div>
  );
}
