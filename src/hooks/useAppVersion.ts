import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SEEN_KEY = "escolheai_seen_version";

export interface AppVersion {
  id: string;
  version: string;
  title: string;
  changelog: string;
  is_current: boolean;
  active: boolean;
  force_update: boolean;
  created_at: string;
}

export function useAppVersion() {
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("app_versions")
      .select("*")
      .eq("is_current", true)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;
        const v = data as AppVersion;
        setVersion(v);
        const seen = localStorage.getItem(SEEN_KEY);
        // Só sinaliza nova versão se ainda não foi visualizada (sem toast automático)
        if (seen !== v.version) setIsNew(true);
      });
    return () => { mounted = false; };
  }, []);

  const markSeen = () => {
    if (version) {
      localStorage.setItem(SEEN_KEY, version.version);
      setIsNew(false);
    }
  };

  return { version, isNew, markSeen };
}
