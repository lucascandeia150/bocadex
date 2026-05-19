import { useEffect, useState } from "react";
import { RefreshCw, Wrench, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import type { MaintenanceConfig } from "@/hooks/useMaintenance";

function formatReturn(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function MaintenanceScreen({ config }: { config: MaintenanceConfig }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  const returnsAt = formatReturn(config.returns_at);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6 py-10 overflow-y-auto">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <img src={logo} alt="Bocadex Delivery's" className="w-20 h-20 rounded-2xl object-contain mb-6 shadow-lg" />

        {config.banner_url ? (
          <img
            src={config.banner_url}
            alt="Manutenção"
            className="w-full max-w-xs rounded-2xl mb-6 object-cover"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Wrench className="w-14 h-14 text-primary" strokeWidth={1.8} />
          </div>
        )}

        <h1 className="text-2xl font-black text-foreground mb-2">
          Em manutenção{dots}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-5">
          {config.message}
        </p>

        {returnsAt && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
            <Clock className="w-4 h-4" />
            Voltaremos {returnsAt}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar aplicativo
        </button>

        <p className="text-[11px] text-muted-foreground mt-6">
          Bocadex Delivery's · EscolheAí
        </p>
      </div>
    </div>
  );
}