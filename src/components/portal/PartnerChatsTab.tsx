import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import OrderChat from "@/components/OrderChat";

interface ChatRow {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  partner_unread: number;
  order_description: string | null;
  order_status: string | null;
}

function fmtTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function PartnerChatsTab({ pin, partnerId }: { pin: string; partnerId: string }) {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ChatRow | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("partner_list_chats", { _pin: pin });
    setLoading(false);
    if (!error && data) setChats(data as ChatRow[]);
  }, [pin]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh list when chats update for this partner
  useEffect(() => {
    const ch = supabase
      .channel(`partner-chats-${partnerId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "chats", filter: `partner_id=eq.${partnerId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [partnerId, load]);

  if (active) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden h-[70vh] flex flex-col mt-3">
        <button
          onClick={() => { setActive(null); load(); }}
          className="flex items-center gap-1 text-[11px] text-muted-foreground px-3 py-2 border-b border-border bg-muted/40"
        >
          <ArrowLeft size={12} /> Voltar para conversas
        </button>
        <div className="flex-1">
          <OrderChat
            chatId={active.id}
            role="partner"
            pin={pin}
            title={`👤 ${active.customer_name}`}
            subtitle={active.order_description?.slice(0, 60) || ""}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="mx-auto text-muted-foreground" size={32} />
          <p className="text-sm font-bold text-foreground mt-2">Nenhuma conversa ainda</p>
          <p className="text-[11px] text-muted-foreground mt-1">As mensagens dos clientes aparecerão aqui.</p>
        </div>
      ) : (
        chats.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c)}
            className="w-full text-left bg-card rounded-2xl border border-border p-3 hover:border-primary/50 active:scale-[.99] transition-all flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
              {c.customer_name?.[0]?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-foreground truncate">{c.customer_name}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{fmtTime(c.last_message_at)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {c.last_message_preview || <span className="italic">Sem mensagens ainda</span>}
              </p>
              {c.order_description && (
                <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">📦 {c.order_description}</p>
              )}
            </div>
            {c.partner_unread > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-black rounded-full bg-red-500 text-white px-1.5">
                {c.partner_unread}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
}