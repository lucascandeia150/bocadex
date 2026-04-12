import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Video } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  youtube_url: string;
  description: string;
  thumbnail_url: string | null;
}

interface Props {
  videos: VideoItem[];
  onRefresh: () => void;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function AdminVideosTab({ videos, onRefresh }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", youtube_url: "", description: "", thumbnail_url: "" });
  const [adding, setAdding] = useState(false);

  const startEdit = (v: VideoItem) => {
    setEditing(v.id);
    setForm({ title: v.title, youtube_url: v.youtube_url, description: v.description, thumbnail_url: v.thumbnail_url || "" });
  };

  const save = async () => {
    const data = {
      title: form.title,
      youtube_url: form.youtube_url,
      description: form.description,
      thumbnail_url: form.thumbnail_url || null,
    };

    if (editing) {
      const { error } = await supabase.from("videos").update(data).eq("id", editing);
      if (error) { toast.error("Erro ao salvar"); return; }
      toast.success("Vídeo salvo ✅");
      setEditing(null);
    } else {
      const { error } = await supabase.from("videos").insert(data);
      if (error) { toast.error("Erro ao adicionar"); return; }
      toast.success("Vídeo adicionado ✅");
      setAdding(false);
    }
    setForm({ title: "", youtube_url: "", description: "", thumbnail_url: "" });
    onRefresh();
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Excluído ✅");
    onRefresh();
  };

  return (
    <div className="space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">🎥 Vídeos ({videos.length})</h2>
        <button onClick={() => { setAdding(true); setForm({ title: "", youtube_url: "", description: "", thumbnail_url: "" }); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
          <Plus size={14} /> Novo
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do vídeo" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="Link do YouTube (ex: https://youtu.be/xxx)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do vídeo" rows={3} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
          <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="URL da thumbnail (opcional)" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground" />
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

      {videos.map((v) => {
        const videoId = extractVideoId(v.youtube_url);
        const thumb = v.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null);
        return (
          <div key={v.id} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex gap-3">
              {thumb && <img src={thumb} alt={v.title} className="w-20 h-14 rounded-lg object-cover" />}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1"><Video size={14} className="text-primary" /> {v.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{v.description}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => startEdit(v)} className="p-2 rounded-xl bg-primary/10 text-primary active:scale-90 transition-transform">
                  <Save size={14} />
                </button>
                <button onClick={() => deleteVideo(v.id)} className="p-2 rounded-xl bg-destructive/10 text-destructive active:scale-90 transition-transform">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {videos.length === 0 && !adding && (
        <p className="text-center text-muted-foreground text-sm py-10">Nenhum vídeo cadastrado ainda 🎥</p>
      )}
    </div>
  );
}
