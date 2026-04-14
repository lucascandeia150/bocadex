import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Eye, EyeOff, Package, ImageIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  business_name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  category_id: string | null;
  partner_id: string | null;
  is_active: boolean;
}

interface Props {
  onRefresh: () => void;
}

export default function AdminProductsTab({ onRefresh }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", image_url: "", price_min: "", price_max: "",
    category_id: "", partner_id: "",
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [pRes, cRes, ptRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("display_order"),
      supabase.from("partner_applications").select("id, business_name").eq("status", "approved"),
    ]);
    if (pRes.data) setProducts(pRes.data as Product[]);
    if (cRes.data) setCategories(cRes.data as Category[]);
    if (ptRes.data) setPartners(ptRes.data as Partner[]);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ name: "", description: "", image_url: "", price_min: "", price_max: "", category_id: "", partner_id: "" });

  const startEdit = (p: Product) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      description: p.description,
      image_url: p.image_url || "",
      price_min: p.price_min?.toString() || "",
      price_max: p.price_max?.toString() || "",
      category_id: p.category_id || "",
      partner_id: p.partner_id || "",
    });
  };

  const buildPayload = () => ({
    name: form.name,
    description: form.description,
    image_url: form.image_url || null,
    price_min: form.price_min ? parseFloat(form.price_min) : null,
    price_max: form.price_max ? parseFloat(form.price_max) : null,
    category_id: form.category_id || null,
    partner_id: form.partner_id || null,
  });

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (editing) {
      const { error } = await supabase.from("products").update(buildPayload()).eq("id", editing);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Produto salvo ✅");
    } else {
      const { error } = await supabase.from("products").insert(buildPayload());
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Produto adicionado ✅");
    }
    setEditing(null);
    setAdding(false);
    resetForm();
    load();
    onRefresh();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    load();
    toast.success(!current ? "Ativado ✅" : "Desativado");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    load();
    onRefresh();
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-images").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("partner-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Imagem enviada ✅");
  };

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getPartnerName = (id: string | null) => partners.find(p => p.id === id)?.business_name || "—";

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground";
  const selectCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground";

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">📦 Produtos ({products.length})</h2>
        <button onClick={() => { setAdding(true); resetForm(); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
          <Plus size={14} /> Novo
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" className={inputCls} />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição" rows={2} className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.price_min} onChange={e => setForm({ ...form, price_min: e.target.value })} placeholder="Preço mín (ex: 5.00)" type="number" step="0.01" className={inputCls} />
            <input value={form.price_max} onChange={e => setForm({ ...form, price_max: e.target.value })} placeholder="Preço máx (ex: 15.00)" type="number" step="0.01" className={inputCls} />
          </div>
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={selectCls}>
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.partner_id} onChange={e => setForm({ ...form, partner_id: e.target.value })} className={selectCls}>
            <option value="">Sem parceiro</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
          </select>

          {/* Image */}
          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Imagem</label>
            {form.image_url && <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-xl object-cover mb-2 border border-border" />}
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold cursor-pointer w-fit">
              <ImageIcon size={14} /> {uploading ? "Enviando..." : "Upload imagem"}
              <input type="file" accept="image/*" onChange={uploadImage} className="hidden" disabled={uploading} />
            </label>
          </div>

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

      {products.map(p => (
        <div key={p.id} className={`bg-card rounded-2xl border p-4 ${p.is_active ? "border-border" : "border-border opacity-50"}`}>
          <div className="flex items-start gap-3">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Package size={20} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{p.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.description || "—"}</p>
              <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                {p.price_min != null && (
                  <span className="text-primary font-bold">
                    R${Number(p.price_min).toFixed(2)}{p.price_max && p.price_max !== p.price_min ? ` – R$${Number(p.price_max).toFixed(2)}` : ""}
                  </span>
                )}
                <span>📁 {getCategoryName(p.category_id)}</span>
                <span>🏪 {getPartnerName(p.partner_id)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => toggleActive(p.id, p.is_active)} className={`p-1.5 rounded-lg ${p.is_active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                {p.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Save size={12} />
              </button>
              <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {products.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum produto cadastrado ainda 📦</p>
      )}
    </div>
  );
}
