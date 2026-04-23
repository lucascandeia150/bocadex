import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomeTile {
  id: string;
  label: string;
  emoji: string;
  icon: string;
  route: string;
  gradient: string;
  fg: string;
  display_order: number;
  is_active: boolean;
}

export function useHomeTiles() {
  const [tiles, setTiles] = useState<HomeTile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("home_tiles")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    setTiles((data as HomeTile[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  return { tiles, loading, reload: load };
}
