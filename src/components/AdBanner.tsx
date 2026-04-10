import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle not loaded yet
    }
  }, []);

  if (placement === "bottom") {
    return (
      <div className={`w-full bg-background border-t border-border py-1 px-2 ${className}`}>
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
      <div className={`w-full rounded-xl overflow-hidden ${className}`}>
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
    <div className={`w-full rounded-2xl overflow-hidden ${className}`}>
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
