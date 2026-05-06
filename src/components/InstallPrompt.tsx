import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const messages = [
  { title: "Instale o Bocadex e decida mais rápido 🚀", sub: "Acesse com 1 toque na tela inicial" },
  { title: "Use como app e economize tempo ⚡", sub: "Sem precisar abrir o navegador" },
  { title: "Acesse com 1 toque 📱", sub: "Instale grátis e use offline" },
];

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [msg] = useState(() => messages[Math.floor(Math.random() * messages.length)]);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("installPromptShown")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!deferredPrompt) return;
    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem("installPromptShown", "true");
    }, 3000);
    return () => clearTimeout(timer);
  }, [deferredPrompt]);

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
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-2.5 shrink-0">
          <Download className="text-primary" size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{msg.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{msg.sub}</p>
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
