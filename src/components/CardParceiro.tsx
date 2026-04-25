import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, Store as StoreIcon, Flame } from "lucide-react";

/**
 * Parceiro padronizado — aceita tanto parceiros do banco (partner_applications)
 * quanto parceiros legados (src/data/stores.ts).
 *
 * Regras globais (não alterar sem revisar):
 * - Todo parceiro DEVE ter id válido. Sem id → não renderiza (loga erro).
 * - Toda navegação vai para "/loja/{id}" (rota universal — resolve DB e legacy).
 * - O componente é o ÚNICO ponto de entrada para listar parceiros no app.
 */
export interface CardParceiroData {
  id?: string | null;
  name?: string | null;
  business_name?: string | null;
  description?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  emoji?: string | null;
  category?: string | null;
  business_type?: string | null;
  highlighted?: boolean;
  offer?: string | null;
}

interface Props {
  partner: CardParceiroData;
  index?: number;
  variant?: "default" | "highlight";
}

export function CardParceiro({ partner, index = 0, variant = "default" }: Props) {
  const navigate = useNavigate();

  // Validação obrigatória — sem id, não renderiza.
  if (!partner || !partner.id || typeof partner.id !== "string" || !partner.id.trim()) {
    if (typeof console !== "undefined") {
      console.error("[CardParceiro] Parceiro sem id válido — não será renderizado.", partner);
    }
    return null;
  }

  const id = partner.id.trim();
  const name = partner.name || partner.business_name || "Parceiro";
  const description = (partner.description || "").split("\n")[0];
  const logo = partner.logo || partner.logo_url || null;
  const category = partner.category || partner.business_type || null;

  const handleClick = () => {
    navigate(`/loja/${id}`);
  };

  const isHighlight = variant === "highlight" || !!partner.highlighted;

  return (
    <button
      onClick={handleClick}
      className="text-left w-full animate-slide-up active:scale-[0.98] transition-transform"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`Abrir loja ${name}`}
    >
      <div
        className={`rounded-2xl border p-4 bg-card shadow-sm ${
          isHighlight ? "border-secondary/50 ring-1 ring-secondary/20" : "border-border"
        }`}
      >
        {isHighlight && (
          <div className="flex items-center gap-1.5 mb-2">
            <Flame size={12} className="text-secondary" />
            <span className="text-[10px] font-black text-secondary uppercase tracking-wide">
              Parceiro destaque
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt={name}
              loading="lazy"
              className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
            />
          ) : partner.emoji ? (
            <span className="text-4xl shrink-0">{partner.emoji}</span>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border shrink-0">
              <StoreIcon size={20} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">{name}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            )}
            {category && (
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-primary font-semibold">
                <MapPin size={11} /> {category}
              </div>
            )}
            {partner.offer && (
              <p className="text-[11px] font-bold text-secondary mt-1">{partner.offer}</p>
            )}
          </div>
          <ChevronRight
            size={18}
            className={`shrink-0 ${isHighlight ? "text-secondary" : "text-muted-foreground"}`}
          />
        </div>
      </div>
    </button>
  );
}
