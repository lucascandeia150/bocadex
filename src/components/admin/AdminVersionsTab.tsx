import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Check, RefreshCw } from "lucide-react";

interface Version {
  id: string;
  version: string;
  changelog: string;
  is_current: boolean;
  created_at: string;
}

export default function AdminVersionsTab() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [newVer, setNewVer] = useState("");
  const [newLog, setNewLog] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_versions").select("*").order("created_at", { ascending: false });
    setVersions((data as Version[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newVer.trim()) { toast.error("Informe o número da versão"); return; }
    const { error } = await supabase.from("app_versions").insert({
      version: newVer.trim(), changelog: newLog.trim(), is_current: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Versão criada e marcada como atual");
    setNewVer(""); setNewLog(""); load();
  };

  const setCurrent = async (id: string) => {
    const { error } = await supabase.from("app_versions").update({ is_current: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Definida como versão atual");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta versão?")) return;
    const { error } = await supabase.from("app_versions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removida");
    load();
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-foreground">📦 Nova versão</h3>
        <input
          value={newVer}
          onChange={(e) => setNewVer(e.target.value)}
          placeholder="Ex: 1.1"
          className="w-full bg-muted rounded-xl px-3 py-2 text-sm"
        />
        <textarea
          value={newLog}
          onChange={(e) => setNewLog(e.target.value)}
          placeholder={"Changelog (uma linha por mudança)\n- Melhorias na home\n- Correções"}
          rows={5}
          className="w-full bg-muted rounded-xl px-3 py-2 text-sm"
        />
        <button onClick={create} className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl active:scale-95">
          <Plus size={14} className="inline mr-1" /> Publicar versão
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-black text-foreground">Histórico</h3>
        <button onClick={load} className="p-2 rounded-xl bg-muted">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="bg-card border border-border rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-foreground">v{v.version}</span>
                {v.is_current && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-green-500/10 text-green-600">
                    ATUAL
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {!v.is_current && (
                  <button onClick={() => setCurrent(v.id)} className="p-2 rounded-lg bg-primary/10 text-primary" title="Definir como atual">
                    <Check size={12} />
                  </button>
                )}
                <button onClick={() => remove(v.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {v.changelog && (
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{v.changelog}</pre>
            )}
            <p className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleString("pt-BR")}</p>
          </div>
        ))}
        {versions.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm py-6">Nenhuma versão ainda</p>
        )}
      </div>
    </div>
  );
}
