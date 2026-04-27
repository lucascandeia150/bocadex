import { supabase } from "@/integrations/supabase/client";

/**
 * Log an admin action to admin_audit_logs.
 * Silently fails so audit issues never break UX.
 */
export async function logAdminAction(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase.rpc as any)("log_audit_event", {
      _actor_type: "admin",
      _actor_id: user?.id ?? null,
      _actor_label: user?.email ?? "admin",
      _action: params.action,
      _entity_type: params.entityType ?? null,
      _entity_id: params.entityId ?? null,
      _description: params.description ?? "",
      _metadata: params.metadata ?? {},
    });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}
