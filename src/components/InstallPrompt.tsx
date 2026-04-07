import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!deferredPrompt || dismissed) return;
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [deferredPrompt, dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-2.5 shrink-0">
          <Download className="text-primary" size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            Instalar o EscolheAí? 🚀
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fica mais rápido de usar no celular
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="gradient-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl shrink-0 active:scale-95 transition-transform"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground p-1 shrink-0"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
