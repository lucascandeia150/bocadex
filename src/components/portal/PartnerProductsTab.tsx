import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Package, Camera, ImagePlus, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  pin: string;
}

const empty = {
  name: "",
  description: "",
  price_min: "" as string,
  price_max: "" as string,
  image_url: "",
  category_id: "" as string,
};

export default function PartnerProductsTab({ pin }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.rpc("partner_list_products", { _pin: pin }),
      supabase.from("categories").select("id, name").order("display_order"),
    ]);
    setLoading(false);
    if (pRes.error) { toast.error("Erro ao carregar produtos"); return; }
    setProducts((pRes.data as Product[]) || []);
    setCategories((cRes.data as Category[]) || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin]);

  const reset = () => { setForm(empty); setEditing(null); setAdding(false); };

  const startEdit = (p: Product) => {
    setEditing(p.id);
    setAdding(false);
    setForm({
      name: p.name,
      description: p.description || "",
      price_min: p.price_min != null ? String(p.price_min) : "",
      price_max: p.price_max != null ? String(p.price_max) : "",
      image_url: p.image_url || "",
      category_id: p.category_id || "",
    });
  };

  const uploadImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande (máx 10MB)"); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxSize: 1280, quality: 0.82 });
      const path = `products/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("partner-images")
        .upload(path, compressed, { contentType: compressed.type || "image/jpeg", upsert: false });
      if (error) { toast.error("Não foi possível enviar. Tente outra imagem."); return; }
      const { data } = supabase.storage.from("partner-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Foto enviada ✅");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const priceMin = form.price_min ? Number(form.price_min) : null;
    const priceMax = form.price_max ? Number(form.price_max) : null;
    if (priceMin !== null && Number.isNaN(priceMin)) { toast.error("Preço mínimo inválido"); return; }
    if (priceMax !== null && Number.isNaN(priceMax)) { toast.error("Preço máximo inválido"); return; }
    if (priceMin !== null && priceMax !== null && priceMax < priceMin) {
      toast.error("Preço máximo menor que mínimo"); return;
    }

    if (editing) {
      const { error } = await supabase.rpc("partner_update_product", {
        _pin: pin,
        _product_id: editing,
        _name: form.name,
        _description: form.description,
        _price_min: priceMin,
        _price_max: priceMax,
        _image_url: form.image_url || null,
        _category_id: form.category_id || null,
        _is_active: null,
      });
      if (error) { toast.error(error.message || "Erro ao salvar"); return; }
      toast.success("Produto atualizado ✅");
    } else {
      const { error } = await supabase.rpc("partner_create_product", {
        _pin: pin,
        _name: form.name,
        _description: form.description,
        _price_min: priceMin,
        _price_max: priceMax,
        _image_url: form.image_url || null,
        _category_id: form.category_id || null,
      });
      if (error) { toast.error(error.message || "Erro ao criar"); return; }
      toast.success("Produto criado ✅");
    }
    reset();
    load();
  };

  const toggle = async (id: string) => {
    const { error } = await supabase.rpc("partner_toggle_product", { _pin: pin, _product_id: id });
    if (error) { toast.error("Erro ao atualizar"); return; }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.rpc("partner_delete_product", { _pin: pin, _product_id: id });
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{products.length} produto(s)</p>
        {!adding && !editing && (
          <button
            onClick={() => { reset(); setAdding(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95"
          >
            <Plus size={14} /> Novo produto
          </button>
        )}
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{editing ? "Editar produto" : "Novo produto"}</p>
            <button onClick={reset} className="p-1 rounded-lg bg-muted"><X size={14} /></button>
          </div>

          {/* Foto do produto — área grande */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Foto do produto</p>
            {form.image_url ? (
              <div className="relative">
                <img src={form.image_url} alt="Pré-visualização"
                  className="w-full h-44 rounded-2xl object-cover border border-border" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center active:scale-90"
                  aria-label="Remover foto">
                  <X size={14} />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-background/70 rounded-2xl flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <label className="block w-full h-44 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 active:scale-[0.99] transition-transform cursor-pointer">
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
                  {uploading ? (
                    <>
                      <Loader2 size={28} className="animate-spin text-primary" />
                      <p className="text-xs font-bold text-primary">Enviando foto...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Camera size={22} />
                      </div>
                      <p className="text-sm font-black text-foreground">📷 Adicionar foto</p>
                      <p className="text-[11px] text-muted-foreground">Toque para enviar imagem do produto</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  disabled={uploading} />
              </label>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold cursor-pointer active:scale-95">
                <Camera size={14} /> Câmera
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  disabled={uploading} />
              </label>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold cursor-pointer active:scale-95">
                <ImagePlus size={14} /> Galeria
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  disabled={uploading} />
              </label>
            </div>
          </div>

          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do produto *"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição" rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none" />

          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.01" min="0" value={form.price_min}
              onChange={(e) => setForm({ ...form, price_min: e.target.value })}
              placeholder="Preço mín (R$)"
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
            <input type="number" step="0.01" min="0" value={form.price_max}
              onChange={(e) => setForm({ ...form, price_max: e.target.value })}
              placeholder="Preço máx (R$)"
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm" />
          </div>

          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
            <option value="">Sem categoria</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex gap-2">
            <button onClick={save}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
              <Save size={14} /> Salvar
            </button>
            <button onClick={reset} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading && products.length === 0 && (
        <p className="text-center text-muted-foreground text-xs py-6">Carregando...</p>
      )}

      {!loading && products.length === 0 && !adding && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Package className="mx-auto mb-2 opacity-50" size={32} />
          Nenhum produto cadastrado
        </div>
      )}

      {products.map((p) => (
        <div key={p.id} className={`bg-card rounded-2xl border border-border p-3 flex gap-3 ${!p.is_active ? "opacity-60" : ""}`}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
              {!p.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">INATIVO</span>}
            </div>
            {p.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>}
            <p className="text-xs text-primary font-bold mt-0.5">
              {p.price_min != null && p.price_max != null && p.price_min !== p.price_max
                ? `R$ ${Number(p.price_min).toFixed(2)} - R$ ${Number(p.price_max).toFixed(2)}`
                : p.price_min != null
                  ? `R$ ${Number(p.price_min).toFixed(2)}`
                  : "Sem preço"}
            </p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg bg-primary/10 text-primary active:scale-90"><Pencil size={12} /></button>
            <button onClick={() => toggle(p.id)} className="p-1.5 rounded-lg bg-muted active:scale-90">
              {p.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive active:scale-90"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}