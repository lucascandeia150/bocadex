import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, ChefHat } from "lucide-react";

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  description: string;
}

interface Props {
  recipes: Recipe[];
  onRefresh: () => void;
}

export default function AdminRecipesTab({ recipes, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", ingredients: "", description: "" });
  const [adding, setAdding] = useState(false);

  const startEdit = (r: Recipe) => {
    setEditing(r.id);
    setForm({ name: r.name, ingredients: r.ingredients.join("\n"), description: r.description });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("recipes").update({
      name: form.name,
      ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      description: form.description,
    }).eq("id", editing);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Receita salva ✅");
    setEditing(null);
    onRefresh();
  };

  const addRecipe = async () => {
    const { error } = await supabase.from("recipes").insert({
      name: form.name,
      ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      description: form.description,
    });
    if (error) { toast.error("Erro ao adicionar"); return; }
    toast.success("Receita adicionada ✅");
    setAdding(false);
    setForm({ name: "", ingredients: "", description: "" });
    onRefresh();
  };

  const deleteRecipe = async (id: string) => {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluída ✅");
    onRefresh();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">🍳 Receitas ({recipes.length})</h2>
        <button onClick={() => { setAdding(true); setForm({ name: "", ingredients: "", description: "" }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
          <Plus size={14} /> Nova
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da receita" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="Ingredientes (um por linha)" rows={4} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Modo de preparo / descrição" rows={4} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <div className="flex gap-2">
            <button onClick={editing ? saveEdit : addRecipe} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              <Save size={14} /> Salvar
            </button>
            <button onClick={() => { setEditing(null); setAdding(false); }} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {recipes.map((r) => (
        <div key={r.id} className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1"><ChefHat size={14} className="text-primary" /> {r.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{r.ingredients.length} ingredientes</p>
              <p className="text-xs text-foreground mt-1 line-clamp-2">{r.description}</p>
            </div>
            <div className="flex gap-1 ml-2">
              <button onClick={() => startEdit(r)} className="p-2 rounded-xl bg-primary/10 text-primary active:scale-90 transition-transform">
                <Save size={14} />
              </button>
              <button onClick={() => deleteRecipe(r.id)} className="p-2 rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {recipes.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhuma receita cadastrada ainda 🍳</p>
      )}
    </div>
  );
}
