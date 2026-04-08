import { supabase } from "@/integrations/supabase/client";

export async function trackAnalyticsEvent(
  eventType: string,
  eventData: Record<string, unknown> = {}
) {
  try {
    await (supabase.from("analytics_events") as any).insert([{
      event_type: eventType,
      event_data: eventData,
    }]);
  } catch (e) {
    // silently fail - analytics should never break UX
    console.warn("Analytics track failed:", e);
  }
}
