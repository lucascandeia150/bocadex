import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

interface Tile {
  id: string;
  label: string;
  emoji: string;
  icon: string;
  route: string;
  gradient: string;
  fg: string;
  display_order: number;
  is_active: boolean;
}

const GRADIENTS = ["gradient-primary", "gradient-secondary", "gradient-warm", "bg-card border border-border"];
const FGS = ["text-primary-foreground", "text-secondary-foreground", "text-foreground"];

export default function AdminHomeTilesTab() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("home_tiles").select("*").order("display_order");
    setTiles((data as Tile[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<Tile>) => {
    const { error } = await supabase.from("home_tiles").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const move = async (t: Tile, dir: -1 | 1) => {
    const sorted = [...tiles].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((x) => x.id === t.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("home_tiles").update({ display_order: swap.display_order }).eq("id", t.id);
    await supabase.from("home_tiles").update({ display_order: t.display_order }).eq("id", swap.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este botão?")) return;
    await supabase.from("home_tiles").delete().eq("id", id);
    load();
  };

  const create = async () => {
    const max = tiles.reduce((m, t) => Math.max(m, t.display_order), 0);
    const { error } = await supabase.from("home_tiles").insert({
      label: "Novo botão", emoji: "✨", icon: "Sparkles",
      route: "/", gradient: "gradient-primary", fg: "text-primary-foreground",
      display_order: max + 1, is_active: true,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Botão criado");
    load();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-foreground">🏠 Botões da Home</h3>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-muted">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={create} className="bg-primary text-primary-foreground font-bold px-3 py-2 rounded-xl text-xs active:scale-95">
            <Plus size={12} className="inline" /> Novo
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Reordene, oculte e edite os botões que aparecem na tela inicial.
      </p>

      <div className="space-y-2">
        {tiles.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-sm font-bold text-foreground flex-1 truncate">{t.label}</span>
              <button onClick={() => move(t, -1)} className="p-1.5 rounded-lg bg-muted"><ArrowUp size={12} /></button>
              <button onClick={() => move(t, 1)} className="p-1.5 rounded-lg bg-muted"><ArrowDown size={12} /></button>
              <button onClick={() => update(t.id, { is_active: !t.is_active })} className="p-1.5 rounded-lg bg-muted">
                {t.is_active ? <Eye size={12} /> : <EyeOff size={12} className="text-muted-foreground" />}
              </button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                <Trash2 size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Texto" value={t.label} onBlur={(v) => update(t.id, { label: v })} />
              <Field label="Emoji" value={t.emoji} onBlur={(v) => update(t.id, { emoji: v })} />
              <Field label="Ícone (lucide)" value={t.icon} onBlur={(v) => update(t.id, { icon: v })} />
              <Field label="Rota" value={t.route} onBlur={(v) => update(t.id, { route: v })} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select label="Estilo de fundo" value={t.gradient} options={GRADIENTS} onChange={(v) => update(t.id, { gradient: v })} />
              <Select label="Cor do texto" value={t.fg} options={FGS} onChange={(v) => update(t.id, { fg: v })} />
            </div>
          </div>
        ))}
        {tiles.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm py-6">Nenhum botão</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onBlur }: { label: string; value: string; onBlur: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground">{label}</label>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onBlur(v)}
        className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs mt-0.5"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs mt-0.5"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
