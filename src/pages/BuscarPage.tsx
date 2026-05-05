import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Store as StoreIcon, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  business_name: string;
  business_type: string | null;
  description: string | null;
  logo_url: string | null;
}

const POPULAR = ["Pizzaria", "Hambúrguer", "Açaí", "Café", "Bebidas", "Doces"];

export default function BuscarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega todas as lojas aprovadas (cache simples)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partner_applications")
        .select("id, business_name, business_type, description, logo_url")
        .eq("status", "approved")
        .eq("is_active", true)
        .eq("visibility", "public")
        .eq("is_demo", false)
        .order("is_featured", { ascending: false });
      setPartners((data ?? []) as Partner[]);
      setLoading(false);
    })();
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Sync URL
  useEffect(() => {
    if (debounced) setSearchParams({ q: debounced }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, [debounced, setSearchParams]);

  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const results = useMemo(() => {
    const q = norm(debounced.trim());
    if (!q) return [];
    return partners.filter((p) => {
      const hay = norm(`${p.business_name} ${p.business_type ?? ""} ${p.description ?? ""}`);
      return hay.includes(q);
    });
  }, [debounced, partners]);

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="max-w-sm mx-auto">
        <div className="relative animate-slide-up">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lojas, pizzaria, açaí…"
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90 transition-transform"
              aria-label="Limpar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Categorias rápidas quando vazio */}
        {!debounced.trim() && (
          <div className="mt-5 animate-slide-up">
            <p className="text-xs font-bold text-muted-foreground mb-2">🔥 Buscas populares</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold text-muted-foreground mb-3">🏪 Todas as lojas</p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <ResultList items={partners} onOpen={(id) => navigate(`/parceiro/${id}`)} />
              )}
            </div>
          </div>
        )}

        {/* Resultados */}
        {debounced.trim() && (
          <div className="mt-5 animate-slide-up">
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} {results.length === 1 ? "loja encontrada" : "lojas encontradas"}
            </p>
            {results.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-5xl block mb-3">🔍</span>
                <p className="text-foreground font-bold">Nenhuma loja encontrada</p>
                <p className="text-xs text-muted-foreground mt-2">Tente outra palavra-chave</p>
                <button
                  onClick={() => navigate("/lojas")}
                  className="mt-4 text-primary font-semibold text-sm"
                >
                  Ver todas as lojas →
                </button>
              </div>
            ) : (
              <ResultList items={results} onOpen={(id) => navigate(`/parceiro/${id}`)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultList({ items, onOpen }: { items: Partner[]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onOpen(p.id)}
          className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform animate-slide-up"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {p.logo_url ? (
            <img
              src={p.logo_url}
              alt={p.business_name}
              loading="lazy"
              className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <StoreIcon size={20} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{p.business_name}</h3>
            {p.business_type && (
              <p className="text-[11px] text-primary font-semibold mt-0.5 flex items-center gap-1">
                <MapPin size={10} /> {p.business_type}
              </p>
            )}
            {p.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {p.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
