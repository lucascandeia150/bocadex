import { useEffect, useRef, useState } from "react";

interface AdBannerProps {
  placement: "bottom" | "inline" | "recipe";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Google AdSense ad component.
 * Publisher: ca-pub-8782325610078220
 */
export function AdBanner({ placement, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const node = adRef.current;
    const wrapper = wrapperRef.current;
    if (!node || !wrapper) return;

    // Só faz push quando o container tem largura real (>0). Caso contrário
    // o adsbygoogle dispara TagError "No slot size for availableWidth=0".
    let cancelled = false;
    const tryPush = () => {
      if (cancelled || pushed.current) return;
      const w = wrapper.getBoundingClientRect().width;
      if (w < 50) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        /* ignore */
      }
    };
    const ro = new ResizeObserver(tryPush);
    ro.observe(wrapper);
    tryPush();

    const check = () => {
      const status = node.getAttribute("data-ad-status");
      if (status === "filled") setFilled(true);
      else if (status === "unfilled") setFilled(false);
    };

    check();
    const observer = new MutationObserver(check);
    observer.observe(node, { attributes: true, attributeFilter: ["data-ad-status"] });

    // Fallback: hide if still not filled after 4s
    const timer = window.setTimeout(check, 4000);

    return () => {
      cancelled = true;
      ro.disconnect();
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Mantém o wrapper com largura real desde o início (visibility:hidden em vez
  // de display:none) para o adsense conseguir medir o slot. Só fica visível
  // quando o anúncio é preenchido.
  const wrapperStyle: React.CSSProperties = filled
    ? { pointerEvents: "auto" }
    : { visibility: "hidden", height: 0, overflow: "hidden", pointerEvents: "none" };

  if (placement === "bottom") {
    return (
      <div
        ref={wrapperRef}
        style={wrapperStyle}
          className={`w-full bg-background border-t border-border py-1 px-2 ${className}`}
      >
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-8782325610078220"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (placement === "recipe") {
    return (
      <div ref={wrapperRef} style={wrapperStyle} className={`w-full rounded-xl overflow-hidden ${className}`}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-8782325610078220"
          data-ad-format="fluid"
          data-ad-layout="in-article"
        />
      </div>
    );
  }

  // inline
  return (
    <div ref={wrapperRef} style={wrapperStyle} className={`w-full rounded-2xl overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8782325610078220"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
