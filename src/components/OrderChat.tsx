import { useEffect, useRef, useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  chat_id: string;
  sender_type: "customer" | "partner" | "admin";
  content: string;
  created_at: string;
  read?: boolean;
}

interface Props {
  chatId: string;
  /** "customer" uses authenticated RPCs; "partner" uses PIN-based RPCs. */
  role: "customer" | "partner";
  pin?: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderChat({ chatId, role, pin, title, subtitle, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const fn = role === "customer" ? "customer_list_messages" : "partner_list_messages";
    const args: any = role === "customer" ? { _chat_id: chatId } : { _pin: pin, _chat_id: chatId };
    const { data, error } = await supabase.rpc(fn as any, args);
    setLoading(false);
    if (error) { toast.error("Erro ao carregar conversa"); return; }
    setMessages((data as Message[]) || []);
  };

  const markRead = async () => {
    if (role === "customer") {
      await supabase.rpc("customer_mark_chat_read", { _chat_id: chatId });
    } else if (pin) {
      await supabase.rpc("partner_mark_chat_read", { _pin: pin, _chat_id: chatId });
    }
  };

  useEffect(() => {
    setLoading(true);
    load().then(markRead);
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => {
            const m = payload.new as Message;
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
          markRead();
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    if (content.length > 1000) { toast.error("Mensagem muito longa"); return; }
    setSending(true);
    const fn = role === "customer" ? "customer_send_message" : "partner_send_message";
    const args: any = role === "customer"
      ? { _chat_id: chatId, _content: content }
      : { _pin: pin, _chat_id: chatId, _content: content };
    const { error } = await supabase.rpc(fn as any, args);
    setSending(false);
    if (error) { toast.error(error.message || "Erro ao enviar"); return; }
    setText("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card">
        <div className="min-w-0">
          <p className="text-sm font-black text-foreground truncate">{title || "Conversa"}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg bg-muted active:scale-95"><X size={14} /></button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/30">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-[11px] text-muted-foreground py-6">
            Inicie a conversa enviando uma mensagem 💬
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_type === role;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-snug shadow-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`text-[9px] mt-0.5 text-right ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                    {fmtTime(m.created_at)}{mine && m.read ? " ✓✓" : mine ? " ✓" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-end gap-2 p-2 border-t border-border bg-card"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          maxLength={1000}
          placeholder="Escreva uma mensagem..."
          className="flex-1 resize-none bg-muted rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-28"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-primary text-primary-foreground rounded-full p-2.5 active:scale-95 disabled:opacity-50"
          aria-label="Enviar"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}