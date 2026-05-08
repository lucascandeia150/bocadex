import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Notif = {
  id: string;
  title: string;
  body: string;
  click_url: string | null;
  read_at: string | null;
  created_at: string;
};

export default function UserNotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Notif[]>([]);
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!user) { setList([]); return; }
    (async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("id, title, body, click_url, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setList((data as Notif[]) ?? []);
      initialLoad.current = false;
    })();

    const ch = supabase.channel(`user-notifs-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "user_notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setList((prev) => [payload.new as Notif, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = useMemo(() => list.filter((n) => !n.read_at).length, [list]);

  if (!user) return null;

  const markRead = async (id: string) => {
    setList((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    await supabase.from("user_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setList((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: now }));
    await supabase.from("user_notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
  };

  const remove = async (id: string) => {
    setList((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("user_notifications").delete().eq("id", id);
  };

  const clearAll = async () => {
    setList([]);
    await supabase.from("user_notifications").delete().eq("user_id", user.id);
  };

  const handleClick = (n: Notif) => {
    if (!n.read_at) markRead(n.id);
    if (n.click_url) navigate(n.click_url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 rounded-full bg-muted hover:bg-accent flex items-center justify-center active:scale-95 transition-all"
        aria-label="Notificações"
      >
        <Bell size={18} className="text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[88vw] max-w-sm bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-black">Notificações</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-bold text-primary hover:underline">
                    Marcar lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {list.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto text-muted-foreground mb-2" size={24} />
                  <p className="text-xs text-muted-foreground">Nenhuma notificação ainda.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Você verá aqui avisos de pedidos e novidades.</p>
                </div>
              ) : list.map((n) => (
                <div key={n.id} className={`flex items-start gap-2 p-3 hover:bg-muted/40 transition-colors ${n.read_at ? "opacity-70" : ""}`}>
                  <button onClick={() => handleClick(n)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <p className="text-xs font-black text-foreground truncate">{n.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("pt-BR")}
                    </p>
                  </button>
                  <div className="flex flex-col gap-1">
                    {!n.read_at && (
                      <button onClick={() => markRead(n.id)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Marcar como lida">
                        <Check size={12} />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Remover">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {list.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-muted/30">
                <button onClick={clearAll} className="text-[11px] font-bold text-muted-foreground hover:text-destructive">
                  Limpar todas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}