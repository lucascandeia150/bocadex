import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  returns_at: string | null;
  banner_url: string | null;
}

const DEFAULT: MaintenanceConfig = {
  enabled: false,
  message:
    "Estamos realizando alguns reajustes e melhorias no sistema. Desculpe pelo inconveniente. Tente novamente em alguns minutos.",
  returns_at: null,
  banner_url: null,
};

const CACHE_KEY = "bocadex_maintenance_cache_v1";

function readCache(): MaintenanceConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function writeCache(c: MaintenanceConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function useMaintenance() {
  const [config, setConfig] = useState<MaintenanceConfig>(
    () => readCache() ?? DEFAULT
  );
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_config")
      .maybeSingle();
    if (data?.value) {
      const merged = { ...DEFAULT, ...(data.value as any) };
      setConfig(merged);
      writeCache(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("maintenance_config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (row?.key === "maintenance_config") load();
        }
      )
      .subscribe();
    const id = setInterval(load, 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(id);
    };
  }, []);

  return { config, loading, reload: load };
}