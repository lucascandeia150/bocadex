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
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle not loaded yet
    }

    const node = adRef.current;
    if (!node) return;

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
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  // Hide wrapper entirely until ad is filled — no empty container, no whitespace.
  const wrapperStyle: React.CSSProperties = filled ? {} : { display: "none" };

  if (placement === "bottom") {
    return (
      <div
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
      <div style={wrapperStyle} className={`w-full rounded-xl overflow-hidden ${className}`}>
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
    <div style={wrapperStyle} className={`w-full rounded-2xl overflow-hidden ${className}`}>
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
