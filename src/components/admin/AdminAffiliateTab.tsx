import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Link2 } from "lucide-react";

interface AffiliateLink {
  id: string;
  keyword: string;
  url: string;
}

interface Props {
  links: AffiliateLink[];
  onRefresh: () => void;
}

export default function AdminAffiliateTab({ links, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ keyword: "", url: "" });
  const [adding, setAdding] = useState(false);

  const startEdit = (l: AffiliateLink) => {
    setEditing(l.id);
    setForm({ keyword: l.keyword, url: l.url });
  };

  const save = async () => {
    if (editing) {
      const { error } = await supabase.from("affiliate_links").update({ keyword: form.keyword, url: form.url }).eq("id", editing);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Link salvo ✅");
      setEditing(null);
    } else {
      const { error } = await supabase.from("affiliate_links").insert({ keyword: form.keyword, url: form.url });
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Link adicionado ✅");
      setAdding(false);
    }
    setForm({ keyword: "", url: "" });
    onRefresh();
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("affiliate_links").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    onRefresh();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">🔗 Links Afiliados ({links.length})</h2>
        <button onClick={() => { setAdding(true); setForm({ keyword: "", url: "" }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
          <Plus size={14} /> Novo
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Palavra-chave (ex: açúcar)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL do afiliado (ex: https://amzn.to/xxx)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              <Save size={14} /> Salvar
            </button>
            <button onClick={() => { setEditing(null); setAdding(false); }} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {links.map((l) => (
        <div key={l.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground flex items-center gap-1"><Link2 size={14} className="text-primary" /> {l.keyword}</p>
            <p className="text-xs text-muted-foreground truncate">{l.url}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <button onClick={() => startEdit(l)} className="p-2 rounded-xl bg-primary/10 text-primary active:scale-90 transition-transform">
              <Save size={14} />
            </button>
            <button onClick={() => deleteLink(l.id)} className="p-2 rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {links.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum link cadastrado ainda 🔗</p>
      )}
    </div>
  );
}
