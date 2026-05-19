import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import MaintenanceScreen from "./MaintenanceScreen";

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { config } = useMaintenance();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const location = useLocation();

  // Sempre liberar rotas administrativas para permitir desativar o modo
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (!config.enabled) return <>{children}</>;
  if (isAdminRoute) return <>{children}</>;
  if (roleLoading) return <>{children}</>;
  if (isAdmin) return <>{children}</>;

  return <MaintenanceScreen config={config} />;
}