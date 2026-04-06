import type { HistoryEntry } from "@/hooks/useHistory";
import { Clock, Trash2 } from "lucide-react";

interface HistoricoPageProps {
  history: HistoryEntry[];
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function HistoricoPage({ history, onClear }: HistoricoPageProps) {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <Clock className="mx-auto text-primary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Histórico</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas escolhas recentes</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center text-muted-foreground mt-16 animate-slide-up">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-lg font-semibold">Nenhuma escolha ainda</p>
          <p className="text-sm mt-1">Vá ao Início e comece a decidir!</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 max-w-sm mx-auto">
            {history.map((entry, i) => (
              <div
                key={entry.timestamp + i}
                className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="text-3xl">{entry.food.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">{entry.food.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.reason}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(entry.timestamp)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClear}
            className="mx-auto mt-6 flex items-center gap-2 text-destructive text-sm font-semibold"
          >
            <Trash2 size={16} />
            Limpar histórico
          </button>
        </>
      )}
    </div>
  );
}
