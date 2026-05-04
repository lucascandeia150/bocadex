import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cached: string | null = null;
let inflight: Promise<string> | null = null;

async function fetchToken(): Promise<string> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("mapbox-token");
    if (error || !data?.token) throw new Error("Mapbox token indisponível");
    cached = data.token as string;
    return cached;
  })();
  try { return await inflight; } finally { inflight = null; }
}

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(cached);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (cached) { setToken(cached); return; }
    fetchToken().then(setToken).catch((e) => setError(e.message));
  }, []);
  return { token, error };
}