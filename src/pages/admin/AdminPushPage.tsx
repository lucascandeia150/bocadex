import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Send, Users } from "lucide-react";
import { toast } from "sonner";

type PushLog = {
  id: string; title: string; body: string; target: string;
  sent_count: number; failed_count: number; created_at: string;
};

export default function AdminPushPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<PushLog[]>([]);
  const [tokenCount, setTokenCount] = useState<number | null>(null);

  const load = async () => {
    const [{ data: l }, { count }] = await Promise.all([
      supabase.from("push_logs").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("device_tokens").select("*", { count: "exact", head: true }),
    ]);
    setLogs((l as PushLog[]) ?? []);
    setTokenCount(count ?? 0);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) { toast.error("Preencha título e mensagem"); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        title: title.trim(), body: body.trim(),
        target, user_id: target === "user" ? userId.trim() : undefined,
        data: link ? { click_url: link.trim() } : {},
      },
    });
    setBusy(false);
    if (error) { toast.error("Erro ao enviar: " + error.message); return; }
    toast.success(`Enviadas: ${data?.sent ?? 0} · Falhas: ${data?.failed ?? 0}`);
    setTitle(""); setBody(""); setLink("");
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground flex items-center gap-2">
          <Bell size={20} className="text-primary" /> Notificações Push
        </h1>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users size={12} /> {tokenCount ?? "…"} dispositivos
        </span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60}
          placeholder="Título (até 60)"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={180} rows={3}
          placeholder="Mensagem (até 180)"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        <input value={link} onChange={(e) => setLink(e.target.value)}
          placeholder="Link de destino (opcional, ex: /lojas)"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
        <div className="flex gap-2">
          <select value={target} onChange={(e) => setTarget(e.target.value as "all" | "user")}
            className="px-3 py-2 rounded-xl border border-border bg-background text-sm">
            <option value="all">Todos</option>
            <option value="user">Usuário específico</option>
          </select>
          {target === "user" && (
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id"
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm" />
          )}
        </div>
        <button onClick={send} disabled={busy}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
          <Send size={14} /> {busy ? "Enviando..." : "Enviar notificação"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-black">Histórico</p>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Nenhum envio ainda.</p>
          ) : logs.map((l) => (
            <div key={l.id} className="p-3">
              <p className="text-xs font-bold">{l.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{l.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(l.created_at).toLocaleString("pt-BR")} · {l.target} ·
                <span className="text-green-600"> ✓ {l.sent_count}</span>
                {l.failed_count > 0 && <span className="text-red-600"> · ✗ {l.failed_count}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}