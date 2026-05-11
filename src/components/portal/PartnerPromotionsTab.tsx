import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Sparkles, Power, X } from "lucide-react";

interface Promotion {
  id: string;
  partner_id: string;
  title: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  is_featured: boolean;
}

const empty = (partnerId: string): Omit<Promotion, "id"> => ({
  partner_id: partnerId,
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_order: 0,
  starts_at: null,
  ends_at: null,
  is_active: true,
  is_featured: false,
});

export default function PartnerPromotionsTab({ partnerId }: { partnerId: string }) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<Promotion, "id">>(empty(partnerId));

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("store_promotions")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) { toast.error("Erro ao carregar promoções"); return; }
    setItems((data as Promotion[]) || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [partnerId]);

  const save = async () => {
    if (!draft.title.trim()) { toast.error("Informe um título"); return; }
    if (!draft.discount_value || draft.discount_value <= 0) { toast.error("Valor de desconto inválido"); return; }
    const { error } = await supabase.from("store_promotions").insert({
      ...draft,
      partner_id: partnerId,
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
    if (error) { toast.error(error.message || "Erro ao salvar"); return; }
    toast.success("Promoção criada ✨");
    setOpen(false);
    setDraft(empty(partnerId));
    load();
  };

  const toggle = async (p: Promotion) => {
    const { error } = await supabase.from("store_promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir promoção?")) return;
    const { error } = await supabase.from("store_promotions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Promoção removida");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black text-foreground flex items-center gap-2">
          <Sparkles size={16} className="text-primary" /> Promoções
        </h2>
        <button
          onClick={() => { setDraft(empty(partnerId)); setOpen(true); }}
          className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-black px-3 py-2 rounded-full active:scale-95"
        >
          <Plus size={14} /> Nova
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <Tag size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-bold text-foreground">Nenhuma promoção ativa</p>
          <p className="text-xs text-muted-foreground mt-1">Crie ofertas para atrair mais clientes!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className={`bg-card border rounded-2xl p-3 ${p.is_active ? "border-primary/30" : "border-border opacity-60"}`}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-md">
                  <span className="text-base font-black leading-none">
                    {p.discount_type === "percent" ? `${p.discount_value}%` : `R$${p.discount_value}`}
                  </span>
                  <span className="text-[8px] uppercase font-bold opacity-90 mt-0.5">OFF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black text-foreground truncate">{p.title}</p>
                    {p.is_featured && <span className="text-[9px] font-black bg-amber-500/15 text-amber-700 px-1.5 py-0.5 rounded-full">DESTAQUE</span>}
                  </div>
                  {p.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                  {p.min_order > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">Mínimo R$ {Number(p.min_order).toFixed(2)}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <button
                    onClick={() => toggle(p)}
                    className={`p-1.5 rounded-lg ${p.is_active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                    title={p.is_active ? "Desativar" : "Ativar"}
                  >
                    <Power size={12} />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-border p-5 w-full max-w-md space-y-3 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Nova promoção</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg bg-muted"><X size={14} /></button>
            </div>

            <Field label="Título *" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Ex: 10% OFF no primeiro pedido" />
            <Field label="Descrição" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} placeholder="Detalhes da oferta" />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-foreground">Tipo</label>
                <select
                  value={draft.discount_type}
                  onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as "percent" | "fixed" })}
                  className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1"
                >
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>
              <NumField label={draft.discount_type === "percent" ? "Desconto (%)" : "Desconto (R$)"} value={draft.discount_value} onChange={(v) => setDraft({ ...draft, discount_value: v })} />
            </div>
            <NumField label="Pedido mínimo (R$)" value={draft.min_order} onChange={(v) => setDraft({ ...draft, min_order: v })} />

            <label className="flex items-center gap-2 text-xs font-bold text-foreground">
              <input
                type="checkbox"
                checked={draft.is_featured}
                onChange={(e) => setDraft({ ...draft, is_featured: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              Destacar promoção na vitrine
            </label>

            <button
              onClick={save}
              className="w-full bg-primary text-primary-foreground font-black py-3 rounded-xl active:scale-95"
            >
              Salvar promoção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-foreground">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1" />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-foreground">{label}</label>
      <input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-muted rounded-xl px-3 py-2 text-sm mt-1" />
    </div>
  );
}
