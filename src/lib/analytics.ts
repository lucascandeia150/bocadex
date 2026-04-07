// Google Analytics 4 helper
// Set your GA4 Measurement ID here
const GA_MEASUREMENT_ID = "G-MJ0SLFEWST";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

let initialized = false;

export function initGA() {
  if (initialized || !GA_MEASUREMENT_ID) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);

  initialized = true;
}

export function trackEvent(eventName: string, params?: Record<string, string | number>) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

export function trackPageView(path: string) {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: path });
  }
}
