import { useState } from "react";
import { Play, Clock } from "lucide-react";

interface DbVideo {
  id: string;
  title: string;
  youtube_url: string;
  description: string;
  thumbnail_url: string | null;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function DbVideoCard({ video }: { video: DbVideo }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYouTubeId(video.youtube_url);
  if (!videoId) return null;

  const thumb = video.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 w-full h-full group">
            <img src={thumb} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-active:bg-black/40 transition-colors">
              <div className="bg-destructive rounded-full p-4 shadow-lg group-active:scale-95 transition-transform">
                <Play size={28} className="text-destructive-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  );
}
