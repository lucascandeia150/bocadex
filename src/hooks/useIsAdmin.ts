import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async (uid?: string) => {
      if (!uid) { if (active) { setIsAdmin(false); setLoading(false); } return; }
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
      if (active) { setIsAdmin(!!data); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data: { session } }) => check(session?.user?.id));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user?.id));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}