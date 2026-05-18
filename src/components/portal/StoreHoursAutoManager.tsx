import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock } from "lucide-react";

type Hours = Record<string, { open: string; close: string; closed?: boolean }>;
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface Props {
  pin: string;
  partnerId: string;
  isOpen: boolean;
  openingHours: Hours | null | undefined;
  onChanged: (isOpen: boolean) => void;
}

const minutesNow = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
const toMin = (hhmm: string) => {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const todayKey = () => new Date().toISOString().slice(0, 10);

export default function StoreHoursAutoManager({ pin, partnerId, isOpen, openingHours, onChanged }: Props) {
  const [warn, setWarn] = useState(false);
  // extra close minutes (e.g. 30 or 60); persisted per day in sessionStorage
  const extraKey = `bocadex_extra_close_${partnerId}_${todayKey()}`;
  const dismissKey = `bocadex_warn_dismiss_${partnerId}_${todayKey()}`;
  const [extraMin, setExtraMin] = useState<number>(() => {
    const v = sessionStorage.getItem(extraKey);
    return v ? Number(v) : 0;
  });
  const lastActionRef = useRef<string>("");

  const today = openingHours?.[DAY_KEYS[new Date().getDay()]];

  const toggle = async (toOpen: boolean) => {
    if (toOpen === isOpen) return;
    const tag = `${todayKey()}-${toOpen ? "open" : "close"}`;
    if (lastActionRef.current === tag) return;
    lastActionRef.current = tag;
    const { data, error } = await supabase.rpc("partner_toggle_open", { _pin: pin });
    if (error) return;
    const s = data as any;
    onChanged(!!s.is_open);
    toast(toOpen ? "🟢 Loja aberta automaticamente" : "🔴 Loja fechada automaticamente");
  };

  useEffect(() => {
    if (!today || today.closed) return;
    const tick = () => {
      const now = minutesNow();
      const openAt = toMin(today.open);
      const closeAt = toMin(today.close) + extraMin;

      // Auto open
      if (!isOpen && now >= openAt && now < closeAt) {
        toggle(true);
      }
      // Auto close (after grace 1min)
      if (isOpen && now >= closeAt) {
        toggle(false);
        setWarn(false);
      }
      // 5-min warning
      const dismissed = sessionStorage.getItem(dismissKey) === "1";
      if (isOpen && !dismissed && closeAt - now <= 5 && closeAt - now > 0 && extraMin === 0) {
        setWarn(true);
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [isOpen, openingHours, extraMin]);

  const extend = (mins: number) => {
    const v = extraMin + mins;
    setExtraMin(v);
    sessionStorage.setItem(extraKey, String(v));
    setWarn(false);
    toast.success(`Loja estendida por +${mins} min — em horário extra`);
  };
  const closeOnTime = () => { setWarn(false); };
  const dontShow = () => {
    sessionStorage.setItem(dismissKey, "1");
    setWarn(false);
  };

  if (!warn) {
    if (extraMin > 0 && isOpen) {
      return (
        <div className="fixed bottom-20 left-3 right-3 z-40 bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
          <Clock size={14} /> Loja em horário extra (+{extraMin}min)
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 flex items-end sm:items-center justify-center p-3">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm p-5 space-y-3 shadow-2xl">
        <div className="flex items-center gap-2">
          <Clock className="text-primary" size={20} />
          <h3 className="text-base font-black text-foreground">Tua loja fechará em 5 minutos</h3>
        </div>
        <p className="text-sm text-muted-foreground">Deseja mantê-la aberta por mais tempo?</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => extend(30)} className="bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm active:scale-95">+30 min</button>
          <button onClick={() => extend(60)} className="bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm active:scale-95">+1 hora</button>
          <button onClick={closeOnTime} className="bg-muted text-foreground font-bold py-2.5 rounded-xl text-sm active:scale-95">Fechar no horário</button>
          <button onClick={dontShow} className="bg-muted text-muted-foreground font-bold py-2.5 rounded-xl text-xs active:scale-95">Não mostrar hoje</button>
        </div>
      </div>
    </div>
  );
}
