import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Eye, EyeOff, Pencil, Upload, Store, CheckCircle, XCircle, Image } from "lucide-react";

interface Partner {
  id: string;
  business_name: string;
  business_type: string;
  address: string;
  description: string;
  whatsapp: string;
  promotions: string | null;
  images: string[] | null;
  logo_url: string | null;
  status: string;
  is_active: boolean;
  uses_app_courier?: boolean;
  created_at: string;
}

interface Props {
  partners: Partner[];
  onRefresh: () => void;
}

const emptyForm = {
  business_name: "",
  business_type: "",
  address: "",
  description: "",
  whatsapp: "",
  promotions: "",
  logo_url: "",
  uses_app_courier: false,
};

export default function AdminPartnersTab({ partners, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const startEdit = (p: Partner) => {
    setEditing(p.id);
    setForm({
      business_name: p.business_name,
      business_type: p.business_type,
      address: p.address,
      description: p.description,
      whatsapp: p.whatsapp,
      promotions: p.promotions || "",
      logo_url: p.logo_url || "",
      uses_app_courier: !!p.uses_app_courier,
    });
    setLogoPreview(p.logo_url || null);
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("partner-images").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar logo");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("partner-images").getPublicUrl(path);
    const url = urlData.publicUrl;
    setForm((f) => ({ ...f, logo_url: url }));
    setLogoPreview(url);
    setUploading(false);
    toast.success("Logo enviada ✅");
  };

  const save = async () => {
    if (!form.business_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    const payload = {
      business_name: form.business_name,
      business_type: form.business_type,
      address: form.address,
      description: form.description,
      whatsapp: form.whatsapp,
      promotions: form.promotions || null,
      logo_url: form.logo_url || null,
      uses_app_courier: form.uses_app_courier,
    };

    if (editing) {
      const { error } = await supabase.from("partner_applications").update(payload).eq("id", editing);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Parceiro atualizado ✅");
      setEditing(null);
    } else {
      const { error } = await supabase.from("partner_applications").insert({ ...payload, status: "approved", is_active: true });
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Parceiro adicionado ✅");
      setAdding(false);
    }
    setForm(emptyForm);
    setLogoPreview(null);
    onRefresh();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("partner_applications").update({ is_active: !currentActive }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(!currentActive ? "Ativado ✅" : "Desativado");
    onRefresh();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("partner_applications").update({ status }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(status === "approved" ? "Aprovado ✅" : "Rejeitado ❌");
    onRefresh();
  };

  const deletePartner = async (id: string) => {
    if (!confirm("Excluir este parceiro?")) return;
    const { error } = await supabase.from("partner_applications").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    onRefresh();
  };

  const cancelEdit = () => {
    setEditing(null);
    setAdding(false);
    setForm(emptyForm);
    setLogoPreview(null);
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">🤝 Parceiros ({partners.length})</h2>
        <button
          onClick={() => { setAdding(true); setForm(emptyForm); setLogoPreview(null); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          <Plus size={14} /> Novo
        </button>
      </div>

      {/* Form */}
      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">{editing ? "✏️ Editando parceiro" : "➕ Novo parceiro"}</p>

          {/* Logo upload */}
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border border-border">
                <Image size={20} className="text-muted-foreground" />
              </div>
            )}
            <label className="flex items-center gap-1 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold cursor-pointer">
              <Upload size={14} /> {uploading ? "Enviando..." : "Upload logo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          </div>

          <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Nome do estabelecimento *" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} placeholder="Tipo (ex: lanchonete, bar)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" rows={2} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground resize-none" />
          <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp (com DDD e país)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.promotions} onChange={(e) => setForm({ ...form, promotions: e.target.value })} placeholder="Promoção (opcional)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />

          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer">
            <input
              type="checkbox"
              checked={form.uses_app_courier}
              onChange={(e) => setForm({ ...form, uses_app_courier: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs font-bold text-foreground">🚚 Utiliza entregador do app?</span>
          </label>

          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              <Save size={14} /> Salvar
            </button>
            <button onClick={cancelEdit} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Partner list */}
      {partners.map((p) => (
        <div key={p.id} className={`bg-card rounded-2xl border p-4 space-y-2 ${!p.is_active ? "opacity-50 border-border" : "border-border"}`}>
          <div className="flex items-start gap-3">
            {p.logo_url ? (
              <img src={p.logo_url} alt={p.business_name} className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border shrink-0">
                <Store size={18} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{p.business_name}</h3>
              <span className="text-xs text-primary font-semibold">{p.business_type}</span>
              <p className="text-xs text-muted-foreground truncate">📍 {p.address}</p>
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                p.status === "approved" ? "bg-green-100 text-green-700" :
                p.status === "rejected" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {p.status === "approved" ? "Aprovado" : p.status === "rejected" ? "Rejeitado" : "Pendente"}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {p.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>

          <div className="flex gap-1 flex-wrap">
            <button onClick={() => startEdit(p)} className="p-2 rounded-xl bg-primary/10 text-primary active:scale-90 transition-transform">
              <Pencil size={14} />
            </button>
            <button onClick={() => toggleActive(p.id, p.is_active)} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-90 transition-transform">
              {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            {p.status === "pending" && (
              <>
                <button onClick={() => updateStatus(p.id, "approved")} className="p-2 rounded-xl bg-green-100 text-green-700 active:scale-90 transition-transform">
                  <CheckCircle size={14} />
                </button>
                <button onClick={() => updateStatus(p.id, "rejected")} className="p-2 rounded-xl bg-red-100 text-red-700 active:scale-90 transition-transform">
                  <XCircle size={14} />
                </button>
              </>
            )}
            <button onClick={() => deletePartner(p.id)} className="p-2 rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {partners.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum parceiro cadastrado ainda 🤝</p>
      )}
    </div>
  );
}
