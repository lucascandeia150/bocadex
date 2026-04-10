import { trackAnalyticsEvent } from "@/lib/trackEvent";

interface AdBannerProps {
  placement: "bottom" | "inline" | "recipe";
  className?: string;
}

/**
 * Ad placeholder component — ready to swap with Google AdSense
 * when the publisher ID (ca-pub-XXXXX) is available.
 * 
 * To activate: replace the placeholder with:
 * <ins className="adsbygoogle" data-ad-client="ca-pub-XXXXX" data-ad-slot="SLOT" />
 */
export function AdBanner({ placement, className = "" }: AdBannerProps) {
  const handleClick = () => {
    trackAnalyticsEvent("ad_placeholder_click", { placement });
  };

  if (placement === "bottom") {
    return (
      <div
        onClick={handleClick}
        className={`w-full bg-gradient-to-r from-muted to-muted/60 border-t border-border py-2 px-4 flex items-center justify-center gap-2 ${className}`}
      >
        <span className="text-[10px] text-muted-foreground">Espaço publicitário • EscolheAí</span>
      </div>
    );
  }

  if (placement === "recipe") {
    return (
      <div
        onClick={handleClick}
        className={`w-full bg-accent/40 border border-border/50 rounded-xl p-3 flex items-center justify-center ${className}`}
      >
        <span className="text-[10px] text-muted-foreground">📢 Anúncio • Apoie o EscolheAí</span>
      </div>
    );
  }

  // inline
  return (
    <div
      onClick={handleClick}
      className={`w-full bg-muted/50 border border-border/50 rounded-2xl p-4 flex items-center justify-center ${className}`}
    >
      <span className="text-xs text-muted-foreground">📢 Espaço publicitário</span>
    </div>
  );
}
