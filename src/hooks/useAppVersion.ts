import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SEEN_KEY = "escolheai_seen_version";

export interface AppVersion {
  id: string;
  version: string;
  changelog: string;
  is_current: boolean;
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
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;
        const v = data as AppVersion;
        setVersion(v);
        const seen = localStorage.getItem(SEEN_KEY);
        if (seen !== v.version) {
          setIsNew(true);
          toast.success(`✨ Nova versão ${v.version} disponível!`, {
            description: v.changelog?.split("\n")[0] || "Confira as novidades",
            duration: 6000,
          });
        }
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
