import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, ArrowUp, ArrowDown, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface Props {
  onRefresh: () => void;
}

export default function AdminCategoriesTab({ onRefresh }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("display_order");
    if (data) setCategories(data as Category[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      const { error } = await supabase.from("categories").update({ name: form.name }).eq("id", editing);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Categoria salva ✅");
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0;
      const { error } = await supabase.from("categories").insert({ name: form.name, display_order: maxOrder });
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Categoria adicionada ✅");
    }
    setEditing(null);
    setAdding(false);
    setForm({ name: "" });
    load();
    onRefresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluída ✅");
    load();
    onRefresh();
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex(c => c.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === categories.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = categories[idx];
    const b = categories[swapIdx];
    await Promise.all([
      supabase.from("categories").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("categories").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    load();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">🏷️ Categorias ({categories.length})</h2>
        <button onClick={() => { setAdding(true); setForm({ name: "" }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
          <Plus size={14} /> Nova
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="Nome da categoria" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
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

      {categories.map((c, i) => (
        <div key={c.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <Tag size={16} className="text-primary shrink-0" />
          <span className="text-sm font-bold text-foreground flex-1">{c.name}</span>
          <div className="flex gap-1">
            <button onClick={() => moveOrder(c.id, "up")} disabled={i === 0} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30">
              <ArrowUp size={12} />
            </button>
            <button onClick={() => moveOrder(c.id, "down")} disabled={i === categories.length - 1} className="p-1.5 rounded-lg bg-muted text-muted-foreground disabled:opacity-30">
              <ArrowDown size={12} />
            </button>
            <button onClick={() => { setEditing(c.id); setForm({ name: c.name }); }} className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Save size={12} />
            </button>
            <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}

      {categories.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhuma categoria cadastrada 🏷️</p>
      )}
    </div>
  );
}
