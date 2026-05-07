import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

let configPromise: Promise<any> | null = null;
async function fetchConfig() {
  if (!configPromise) {
    configPromise = supabase.functions.invoke("firebase-config").then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
  }
  return configPromise;
}

export async function isPushSupported() {
  try { return await isSupported(); } catch { return false; }
}

export async function registerPush(): Promise<{ ok: boolean; reason?: string; token?: string }> {
  if (!(await isPushSupported())) return { ok: false, reason: "not-supported" };
  if (typeof Notification === "undefined") return { ok: false, reason: "no-notification-api" };

  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "denied" };

  const config = await fetchConfig();
  if (!config?.apiKey || !config?.vapidKey) return { ok: false, reason: "no-config" };

  if (!getApps().length) initializeApp(config);
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  await navigator.serviceWorker.ready;

  // Pass config to SW so it can handle background messages
  reg.active?.postMessage({ type: "FIREBASE_CONFIG", config });

  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: reg,
  });
  if (!token) return { ok: false, reason: "no-token" };

  await supabase.rpc("register_device_token", {
    _token: token,
    _platform: "web",
    _user_agent: navigator.userAgent.slice(0, 200),
  });

  // Foreground messages → show toast-like native notification
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || "Bocadex Delivery's";
    const body = payload.notification?.body || payload.data?.body || "";
    try { new Notification(title, { body, icon: "/icon-192.png" }); } catch { /* noop */ }
  });

  return { ok: true, token };
}