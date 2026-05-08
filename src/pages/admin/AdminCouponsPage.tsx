import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Pencil } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: string;
  value: number;
  min_order: number;
  max_discount: number | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  active: boolean;
}

const empty: Partial<Coupon> = {
  code: "",
  description: "",
  type: "percent",
  value: 10,
  min_order: 0,
  per_user_limit: 1,
  active: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const code = (editing.code || "").trim().toUpperCase();
    if (!code) { toast.error("Informe o código"); return; }
    if (!editing.value || editing.value <= 0) { toast.error("Valor inválido"); return; }

    const payload = {
      code,
      description: editing.description || "",
      type: editing.type || "percent",
      value: Number(editing.value),
      min_order: Number(editing.min_order || 0),
      max_discount: editing.max_discount ? Number(editing.max_discount) : null,
      expires_at: editing.expires_at || null,
      usage_limit: editing.usage_limit ? Number(editing.usage_limit) : null,
      per_user_limit: Number(editing.per_user_limit ?? 1),
      active: editing.active ?? true,
    };

    const q = editing.id
      ? supabase.from("coupons").update(payload).eq("id", editing.id)
      : supabase.from("coupons").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success("Cupom salvo");
    setEditing(null);
    load();
  };

  const toggle = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Excluir cupom ${c.code}?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Cupom removido");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Ticket size={22} className="text-primary" /> Cupons
          </h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie cupons de desconto.</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 active:scale-95"
        >
          <Plus size={14} /> Novo cupom
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Ticket className="mx-auto text-muted-foreground mb-2" size={28} />
          <p className="text-sm font-bold text-foreground">Nenhum cupom criado ainda</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {coupons.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-foreground tracking-wider">{c.code}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {c.type === "percent" ? `${c.value}%` : `R$ ${Number(c.value).toFixed(2)}`}
                  </span>
                  {!c.active && <span className="text-[10px] font-bold text-destructive">DESATIVADO</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {c.description || "—"} · usados {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggle(c)} className="p-2 rounded-lg hover:bg-muted" title="Ativar/Desativar">
                  {c.active ? <ToggleRight className="text-primary" size={20} /> : <ToggleLeft className="text-muted-foreground" size={20} />}
                </button>
                <button onClick={() => setEditing(c)} className="p-2 rounded-lg hover:bg-muted">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(c)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl p-5 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-foreground">{editing.id ? "Editar cupom" : "Novo cupom"}</h2>
            <Field label="Código">
              <input value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="EX: BEMVINDO10" />
            </Field>
            <Field label="Descrição">
              <input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" placeholder="10% de desconto na 1ª compra" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tipo">
                <select value={editing.type || "percent"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm">
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Fixo (R$)</option>
                </select>
              </Field>
              <Field label="Valor">
                <input type="number" step="0.01" value={editing.value ?? 0} onChange={(e) => setEditing({ ...editing, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </Field>
              <Field label="Pedido mínimo (R$)">
                <input type="number" step="0.01" value={editing.min_order ?? 0} onChange={(e) => setEditing({ ...editing, min_order: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </Field>
              <Field label="Limite total de uso">
                <input type="number" value={editing.usage_limit ?? ""} onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="ilimitado"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </Field>
              <Field label="Por usuário">
                <input type="number" value={editing.per_user_limit ?? 1} onChange={(e) => setEditing({ ...editing, per_user_limit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </Field>
              <Field label="Validade">
                <input type="datetime-local" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Ativo
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-border text-sm font-bold">Cancelar</button>
              <button onClick={save} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">{label}</label>
      {children}
    </div>
  );
}