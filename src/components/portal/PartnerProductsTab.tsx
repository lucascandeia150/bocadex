import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Save, X, Package, Camera, ImagePlus, Loader2, Star, Flame, ChevronUp, ChevronDown } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  image_url: string | null;
  category_id: string | null;
  partner_category_id: string | null;
  is_featured: boolean;
  original_price: number | null;
  display_order: number;
  is_active: boolean;
}
interface PartnerCat { id: string; name: string; icon: string; }

interface Props { pin: string; partnerId: string; }

const empty = {
  name: "", description: "",
  price_min: "", price_max: "", image_url: "",
  partner_category_id: "",
  is_featured: false,
  is_promo: false,
  original_price: "",
};

export default function PartnerProductsTab({ pin, partnerId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<PartnerCat[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.rpc("partner_list_products", { _pin: pin }),
      supabase.rpc("partner_list_categories", { _pin: pin }),
    ]);
    setLoading(false);
    if (pRes.error) { toast.error("Erro ao carregar produtos"); return; }
    setProducts((pRes.data as Product[]) || []);
    setCategories(((cRes.data as PartnerCat[]) || []));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pin]);

  const reset = () => { setForm(empty); setEditing(null); setAdding(false); };

  const startEdit = (p: Product) => {
    setEditing(p.id); setAdding(false);
    setForm({
      name: p.name, description: p.description || "",
      price_min: p.price_min != null ? String(p.price_min) : "",
      price_max: p.price_max != null ? String(p.price_max) : "",
      image_url: p.image_url || "",
      partner_category_id: p.partner_category_id || "",
      is_featured: !!p.is_featured,
      is_promo: p.original_price != null,
      original_price: p.original_price != null ? String(p.original_price) : "",
    });
  };

  const uploadImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande (máx 10MB)"); return; }
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxSize: 1280, quality: 0.82 });
      const path = `${partnerId}/products/${Date.now()}-${Math.random().toString(36).slice(2,7)}.jpg`;
      const { error } = await supabase.storage.from("partner-images")
        .upload(path, compressed, { contentType: compressed.type || "image/jpeg" });
      if (error) { toast.error("Falha no upload"); return; }
      const { data } = supabase.storage.from("partner-images").getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
      toast.success("Foto enviada ✅");
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const priceMin = form.price_min ? Number(form.price_min) : null;
    const priceMax = form.price_max ? Number(form.price_max) : null;
    const original = form.is_promo && form.original_price ? Number(form.original_price) : null;
    if (priceMin !== null && priceMax !== null && priceMax < priceMin) { toast.error("Preço máx menor que mín"); return; }
    if (form.is_promo && original !== null && priceMin !== null && original <= priceMin) {
      toast.error("Preço 'de' deve ser maior que o atual"); return;
    }

    if (editing) {
      const { error } = await supabase.rpc("partner_update_product", {
        _pin: pin, _product_id: editing,
        _name: form.name, _description: form.description,
        _price_min: priceMin, _price_max: priceMax,
        _image_url: form.image_url || null,
        _category_id: null,
        _is_active: null,
        _partner_category_id: form.partner_category_id || null,
        _is_featured: form.is_featured,
        _original_price: original,
        _clear_original_price: !form.is_promo,
      });
      if (error) { toast.error(error.message || "Erro ao salvar"); return; }
      toast.success("Produto atualizado ✅");
    } else {
      const { error } = await supabase.rpc("partner_create_product", {
        _pin: pin,
        _name: form.name, _description: form.description,
        _price_min: priceMin, _price_max: priceMax,
        _image_url: form.image_url || null,
        _category_id: null,
        _partner_category_id: form.partner_category_id || null,
        _is_featured: form.is_featured,
        _original_price: original,
      });
      if (error) { toast.error(error.message || "Erro ao criar"); return; }
      toast.success("Produto criado ✅");
    }
    reset(); load();
  };

  const toggle = async (id: string) => {
    const { error } = await supabase.rpc("partner_toggle_product", { _pin: pin, _product_id: id });
    if (error) { toast.error("Erro"); return; }
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.rpc("partner_delete_product", { _pin: pin, _product_id: id });
    if (error) { toast.error("Erro"); return; }
    toast.success("Excluído ✅"); load();
  };
  const move = async (p: Product, dir: -1 | 1) => {
    const sameCat = products
      .filter(x => x.partner_category_id === p.partner_category_id)
      .sort((a, b) => a.display_order - b.display_order);
    const i = sameCat.findIndex(x => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= sameCat.length) return;
    const other = sameCat[j];
    await Promise.all([
      supabase.rpc("partner_set_product_order", { _pin: pin, _product_id: p.id, _order: other.display_order }),
      supabase.rpc("partner_set_product_order", { _pin: pin, _product_id: other.id, _order: p.display_order }),
    ]);
    load();
  };

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "featured") list = list.filter(p => p.is_featured);
    else if (filter === "promo") list = list.filter(p => p.original_price != null);
    else if (filter === "uncat") list = list.filter(p => !p.partner_category_id);
    else if (filter !== "all") list = list.filter(p => p.partner_category_id === filter);
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [products, filter]);

  const catName = (id: string | null) => categories.find(c => c.id === id)?.name || "Sem categoria";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{products.length} produto(s)</p>
        {!adding && !editing && (
          <button onClick={() => { reset(); setAdding(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
            <Plus size={14}/> Novo produto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { id: "all", label: "Todos" },
          { id: "featured", label: "⭐ Destaques" },
          { id: "promo", label: "🔥 Promo" },
          ...categories.map(c => ({ id: c.id, label: `${c.icon} ${c.name}` })),
          { id: "uncat", label: "Sem categoria" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${filter===f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{editing ? "Editar produto" : "Novo produto"}</p>
            <button onClick={reset} className="p-1 rounded-lg bg-muted"><X size={14}/></button>
          </div>

          {/* Foto */}
          {form.image_url ? (
            <div className="relative">
              <img src={form.image_url} alt="" className="w-full h-44 rounded-2xl object-cover border border-border"/>
              <button type="button" onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center"><X size={14}/></button>
            </div>
          ) : (
            <label className="block w-full h-44 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 cursor-pointer">
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                {uploading ? <Loader2 className="animate-spin text-primary" size={28}/> : <Camera size={22} className="text-primary"/>}
                <p className="text-sm font-black text-foreground">{uploading ? "Enviando..." : "📷 Adicionar foto"}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}/>
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold cursor-pointer">
              <Camera size={14}/> Câmera
              <input type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading}
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}/>
            </label>
            <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-xs font-bold cursor-pointer">
              <ImagePlus size={14}/> Galeria
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}/>
            </label>
          </div>

          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Nome do produto *" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"/>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none"/>

          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.01" min="0" value={form.price_min}
              onChange={e => setForm({ ...form, price_min: e.target.value })}
              placeholder="Preço (R$)" className="px-3 py-2 rounded-xl border border-border bg-background text-sm"/>
            <input type="number" step="0.01" min="0" value={form.price_max}
              onChange={e => setForm({ ...form, price_max: e.target.value })}
              placeholder="Preço máx (opcional)" className="px-3 py-2 rounded-xl border border-border bg-background text-sm"/>
          </div>

          <select value={form.partner_category_id} onChange={e => setForm({ ...form, partner_category_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border-2 ${form.is_featured ? "bg-secondary/20 text-secondary border-secondary" : "border-border bg-background text-muted-foreground"}`}>
              <Star size={14} className={form.is_featured ? "fill-secondary" : ""}/> Destaque
            </button>
            <button type="button" onClick={() => setForm({ ...form, is_promo: !form.is_promo })}
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border-2 ${form.is_promo ? "bg-destructive/10 text-destructive border-destructive" : "border-border bg-background text-muted-foreground"}`}>
              <Flame size={14}/> Em promoção
            </button>
          </div>
          {form.is_promo && (
            <input type="number" step="0.01" min="0" value={form.original_price}
              onChange={e => setForm({ ...form, original_price: e.target.value })}
              placeholder="Preço de (riscado) — ex: 19.90"
              className="w-full px-3 py-2 rounded-xl border border-destructive/40 bg-destructive/5 text-sm"/>
          )}

          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
              <Save size={14}/> Salvar
            </button>
            <button onClick={reset} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">Cancelar</button>
          </div>
        </div>
      )}

      {loading && products.length === 0 && (
        <p className="text-center text-muted-foreground text-xs py-6">Carregando...</p>
      )}
      {!loading && filtered.length === 0 && !adding && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <Package className="mx-auto mb-2 opacity-50" size={32}/>
          Nenhum produto nesta visão
        </div>
      )}

      {filtered.map((p, i, arr) => {
        const isPromo = p.original_price != null;
        return (
          <div key={p.id} className={`bg-card rounded-2xl border border-border p-3 flex gap-3 ${!p.is_active ? "opacity-60" : ""}`}>
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} loading="lazy" className="w-16 h-16 rounded-xl object-cover shrink-0"/>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0 text-2xl">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                {p.is_featured && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">⭐</span>}
                {isPromo && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">PROMO</span>}
                {!p.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">INATIVO</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{catName(p.partner_category_id)}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                {isPromo && <span className="text-[10px] line-through text-muted-foreground">R$ {Number(p.original_price).toFixed(2)}</span>}
                <span className="text-xs font-black text-primary">
                  {p.price_min != null ? `R$ ${Number(p.price_min).toFixed(2)}` : "Sem preço"}
                  {p.price_max != null && p.price_max !== p.price_min ? ` – ${Number(p.price_max).toFixed(2)}` : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(p, -1)} disabled={i===0} className="p-1 rounded bg-muted disabled:opacity-30"><ChevronUp size={11}/></button>
              <button onClick={() => move(p, 1)} disabled={i===arr.length-1} className="p-1 rounded bg-muted disabled:opacity-30"><ChevronDown size={11}/></button>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg bg-primary/10 text-primary"><Pencil size={12}/></button>
              <button onClick={() => toggle(p.id)} className="p-1.5 rounded-lg bg-muted">{p.is_active ? <EyeOff size={12}/> : <Eye size={12}/>}</button>
              <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={12}/></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
