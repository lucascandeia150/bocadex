import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, X, ShoppingBag, Store, Bike, MessageCircle } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

interface FabAction {
  label: string;
  emoji: string;
  icon: typeof ShoppingBag;
  bg: string;
  onClick: () => void;
}

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  // Hide on admin/portal for cleaner UX
  const hidden =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/portal");

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (hidden) return null;

  const openWhatsApp = () => {
    trackAnalyticsEvent("whatsapp_click", { source: "fab_menu" });
    const message = encodeURIComponent("Olá! Entrei em contato pelo app Bocadex 😄");
    window.open(`https://wa.me/5533998669482?text=${message}`, "_blank");
  };

  const actions: FabAction[] = [
    {
      label: "Meus pedidos",
      emoji: "🛒",
      icon: ShoppingBag,
      bg: "bg-primary",
      onClick: () => navigate("/pedidos"),
    },
    {
      label: "Ver lojas",
      emoji: "🍔",
      icon: Store,
      bg: "bg-secondary",
      onClick: () => navigate("/lojas"),
    },
    {
      label: "Entregas",
      emoji: "🚚",
      icon: Bike,
      bg: "bg-[hsl(28,90%,55%)]",
      onClick: () => navigate("/seja-entregador"),
    },
    {
      label: "Suporte",
      emoji: "💬",
      icon: MessageCircle,
      bg: "bg-[hsl(142,70%,45%)]",
      onClick: openWhatsApp,
    },
  ];

  return (
    <>
      {/* Soft backdrop — não bloqueia interação fora dos botões da home */}
      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/20 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={ref} className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2.5">
        {/* Action items */}
        {open &&
          actions.map((a, i) => {
            const Icon = a.icon;
            return (
              <div
                key={a.label}
                className="flex items-center gap-2 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="bg-card text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-border whitespace-nowrap">
                  {a.label}
                </span>
                <button
                  onClick={() => {
                    a.onClick();
                    setOpen(false);
                  }}
                  aria-label={a.label}
                  className={`${a.bg} text-white w-12 h-12 rounded-full shadow-lg active:scale-90 transition-transform flex items-center justify-center`}
                >
                  <Icon size={20} />
                </button>
              </div>
            );
          })}

        {/* Main FAB */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu rápido"}
          aria-expanded={open}
          className={`w-14 h-14 rounded-full shadow-lg active:scale-90 transition-all flex items-center justify-center text-white ${
            open
              ? "bg-foreground rotate-45"
              : "bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] animate-bounce-in"
          }`}
        >
          {open ? <X size={26} className="-rotate-45" /> : <Plus size={28} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  );
}
