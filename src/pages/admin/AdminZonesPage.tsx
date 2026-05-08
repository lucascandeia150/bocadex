import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Save, Power } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  keywords: string[];
  fee: number;
  courier_payout: number;
  is_active: boolean;
  display_order: number;
}

const empty: Omit<Zone, "id"> = {
  name: "",
  keywords: [],
  fee: 0,
  courier_payout: 0,
  is_active: true,
  display_order: 0,
};

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Omit<Zone, "id">>({ ...empty });
  const [keywordsInput, setKeywordsInput] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .order("display_order")
      .order("created_at");
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar zonas");
      return;
    }
    setZones((data as Zone[]) || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (z: Partial<Zone> & { id?: string | null }) => {
    const { error } = await supabase.rpc("admin_upsert_zone", {
      _id: z.id ?? null,
      _name: z.name || "",
      _keywords: z.keywords || [],
      _fee: Number(z.fee || 0),
      _courier_payout: Number(z.courier_payout || 0),
      _is_active: z.is_active ?? true,
      _display_order: Number(z.display_order || 0),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Zona salva");
    if (!z.id) {
      setDraft({ ...empty });
      setKeywordsInput("");
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta zona?")) return;
    const { error } = await supabase.rpc("admin_delete_zone", { _id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Zona excluída");
    load();
  };

  const updateZone = (id: string, patch: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <MapPin className="text-primary" /> Zonas de entrega
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre bairros ou regiões com taxas próprias. O sistema procura uma palavra-chave
          dentro do endereço do cliente para aplicar a taxa correta.
        </p>
      </div>

      {/* Nova zona */}
      <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
        <p className="text-sm font-black text-foreground flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Adicionar nova zona
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Nome (ex: Centro)">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Palavras-chave do endereço (separadas por vírgula)">
            <input
              value={keywordsInput}
              onChange={(e) => {
                setKeywordsInput(e.target.value);
                setDraft({ ...draft, keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) });
              }}
              placeholder="centro, praça, avenida principal"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Taxa cobrada (R$)">
            <input
              type="number" step="0.01"
              value={draft.fee}
              onChange={(e) => setDraft({ ...draft, fee: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Repasse ao entregador (R$)">
            <input
              type="number" step="0.01"
              value={draft.courier_payout}
              onChange={(e) => setDraft({ ...draft, courier_payout: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
          <Field label="Ordem de prioridade (menor = primeiro)">
            <input
              type="number"
              value={draft.display_order}
              onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            />
          </Field>
        </div>
        <button
          onClick={() => save({ id: null, ...draft })}
          disabled={!draft.name.trim()}
          className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50 active:scale-95"
        >
          Adicionar zona
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : zones.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma zona cadastrada — a taxa padrão será sempre usada.</p>
      ) : (
        <div className="space-y-3">
          {zones.map((z) => (
            <div key={z.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Nome">
                  <input
                    value={z.name}
                    onChange={(e) => updateZone(z.id, { name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </Field>
                <Field label="Palavras-chave">
                  <input
                    value={(z.keywords || []).join(", ")}
                    onChange={(e) => updateZone(z.id, { keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </Field>
                <Field label="Taxa (R$)">
                  <input type="number" step="0.01"
                    value={z.fee}
                    onChange={(e) => updateZone(z.id, { fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </Field>
                <Field label="Repasse entregador (R$)">
                  <input type="number" step="0.01"
                    value={z.courier_payout}
                    onChange={(e) => updateZone(z.id, { courier_payout: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </Field>
                <Field label="Ordem">
                  <input type="number"
                    value={z.display_order}
                    onChange={(e) => updateZone(z.id, { display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </Field>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => updateZone(z.id, { is_active: !z.is_active })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${z.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    <Power size={12} /> {z.is_active ? "Ativa" : "Inativa"}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => remove(z.id)}
                  className="flex items-center gap-1.5 text-destructive font-bold text-xs px-3 py-2 rounded-xl hover:bg-destructive/10"
                >
                  <Trash2 size={14} /> Excluir
                </button>
                <button
                  onClick={() => save(z)}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-3 py-2 rounded-xl active:scale-95"
                >
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black text-muted-foreground uppercase mb-1 block">{label}</label>
      {children}
    </div>
  );
}