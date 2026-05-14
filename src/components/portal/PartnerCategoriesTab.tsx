import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, ChevronUp, ChevronDown, Eye, EyeOff, FolderOpen, Camera, Loader2 } from "lucide-react";
import { uploadPartnerImage } from "@/lib/uploadPartnerImage";

interface Cat {
  id: string;
  name: string;
  icon: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface Props { pin: string; partnerId: string; }

const empty = { name: "", icon: "🍽️", image_url: "" };

export default function PartnerCategoriesTab({ pin, partnerId }: Props) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("partner_list_categories", { _pin: pin });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar categorias"); return; }
    setCats((data as Cat[]) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin]);

  const reset = () => { setForm(empty); setEditing(null); setAdding(false); };

  const startEdit = (c: Cat) => {
    setEditing(c.id); setAdding(false);
    setForm({ name: c.name, icon: c.icon, image_url: c.image_url || "" });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadPartnerImage(file, {
        folder: `${partnerId}/categories`,
        maxSize: 600,
        quality: 0.85,
      });
      setForm(f => ({ ...f, image_url: url }));
      toast.success("Imagem enviada ✅");
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (editing) {
      const { error } = await supabase.rpc("partner_update_category", {
        _pin: pin, _id: editing, _name: form.name, _icon: form.icon,
        _image_url: form.image_url || null, _display_order: null, _is_active: null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria atualizada ✅");
    } else {
      const { error } = await supabase.rpc("partner_create_category", {
        _pin: pin, _name: form.name, _icon: form.icon, _image_url: form.image_url || null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria criada ✅");
    }
    reset(); load();
  };

  const move = async (c: Cat, dir: -1 | 1) => {
    const sorted = [...cats].sort((a, b) => a.display_order - b.display_order);
    const i = sorted.findIndex(x => x.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const other = sorted[j];
    await Promise.all([
      supabase.rpc("partner_update_category", { _pin: pin, _id: c.id, _name: null, _icon: null, _image_url: c.image_url, _display_order: other.display_order, _is_active: null }),
      supabase.rpc("partner_update_category", { _pin: pin, _id: other.id, _name: null, _icon: null, _image_url: other.image_url, _display_order: c.display_order, _is_active: null }),
    ]);
    load();
  };

  const toggleActive = async (c: Cat) => {
    const { error } = await supabase.rpc("partner_update_category", {
      _pin: pin, _id: c.id, _name: null, _icon: null, _image_url: c.image_url,
      _display_order: null, _is_active: !c.is_active,
    });
    if (error) { toast.error("Erro"); return; }
    load();
  };

  const remove = async (c: Cat) => {
    if (!confirm(`Excluir "${c.name}"? Produtos ficarão sem categoria.`)) return;
    const { error } = await supabase.rpc("partner_delete_category", { _pin: pin, _id: c.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Excluída ✅");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{cats.length} categoria(s)</p>
        {!adding && !editing && (
          <button onClick={() => { reset(); setAdding(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
            <Plus size={14} /> Nova categoria
          </button>
        )}
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{editing ? "Editar" : "Nova"} categoria</p>
            <button onClick={reset} className="p-1 rounded-lg bg-muted"><X size={14}/></button>
          </div>

          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center text-3xl shrink-0">
              {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" /> : form.icon}
            </div>
            <div className="flex-1 space-y-2">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nome (ex: Cervejas)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="Emoji (ex: 🍺)" maxLength={4} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            </div>
          </div>

          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold cursor-pointer active:scale-95">
            {uploading ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>}
            {uploading ? "Enviando..." : (form.image_url ? "Trocar imagem" : "Imagem (opcional)")}
            <input type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          </label>
          {form.image_url && (
            <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))}
              className="text-[11px] text-destructive font-bold">Remover imagem</button>
          )}

          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
              <Save size={14} /> Salvar
            </button>
            <button onClick={reset} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">Cancelar</button>
          </div>
        </div>
      )}

      {!loading && cats.length === 0 && !adding && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <FolderOpen className="mx-auto mb-2 opacity-50" size={32}/>
          Nenhuma categoria criada
          <p className="text-[11px] mt-1">Crie categorias para organizar seu cardápio (ex: Cervejas, Combos…)</p>
        </div>
      )}

      {[...cats].sort((a,b) => a.display_order - b.display_order).map((c, i, arr) => (
        <div key={c.id} className={`bg-card rounded-2xl border border-border p-3 flex items-center gap-3 ${!c.is_active ? "opacity-60" : ""}`}>
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center text-2xl shrink-0">
            {c.image_url ? <img src={c.image_url} alt={c.name} loading="lazy" className="w-full h-full object-cover" /> : c.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
            <p className="text-[11px] text-muted-foreground">Ordem #{i+1}{!c.is_active && " · oculta"}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => move(c, -1)} disabled={i===0} className="p-1 rounded bg-muted disabled:opacity-30"><ChevronUp size={12}/></button>
            <button onClick={() => move(c, 1)} disabled={i===arr.length-1} className="p-1 rounded bg-muted disabled:opacity-30"><ChevronDown size={12}/></button>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg bg-primary/10 text-primary"><Pencil size={12}/></button>
            <button onClick={() => toggleActive(c)} className="p-1.5 rounded-lg bg-muted">{c.is_active ? <EyeOff size={12}/> : <Eye size={12}/>}</button>
            <button onClick={() => remove(c)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={12}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}
