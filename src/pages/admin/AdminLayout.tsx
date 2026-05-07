import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, ShoppingBag, Store, Package, Users, DollarSign, Star,
  Settings, ScrollText, LogOut, Menu, X, Activity, ChevronRight, Bike,
  Bell, type LucideIcon
} from "lucide-react";
import AdminNotificationCenter from "@/components/admin/AdminNotificationCenter";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  group?: string;
}

const NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true, group: "Visão geral" },
  { to: "/admin/dashboard/orders", label: "Pedidos", icon: ShoppingBag, group: "Operação" },
  { to: "/admin/dashboard/stores", label: "Lojas", icon: Store, group: "Operação" },
  { to: "/admin/dashboard/couriers", label: "Entregadores", icon: Bike, group: "Operação" },
  { to: "/admin/dashboard/products", label: "Produtos", icon: Package, group: "Catálogo" },
  { to: "/admin/dashboard/customers", label: "Clientes", icon: Users, group: "Catálogo" },
  { to: "/admin/dashboard/finance", label: "Financeiro", icon: DollarSign, group: "Negócio" },
  { to: "/admin/dashboard/reviews", label: "Avaliações", icon: Star, group: "Negócio" },
  { to: "/admin/dashboard/push", label: "Notificações Push", icon: Bell, group: "Negócio" },
  { to: "/admin/dashboard/settings", label: "Configurações", icon: Settings, group: "Sistema" },
  { to: "/admin/dashboard/logs", label: "Logs / Auditoria", icon: ScrollText, group: "Sistema" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [systemOk, setSystemOk] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }
      setAdminEmail(user.email || "Admin");
      setChecking(false);
    })();
  }, [navigate]);

  // Realtime: pending partner applications + new paid deliveries (lightweight notification badge)
  useEffect(() => {
    const refreshBadges = async () => {
      const [{ count: pPart }, { count: pDel }, { count: pCour }] = await Promise.all([
        supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "disponivel"),
        supabase.from("courier_applications").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      setPendingCount((pPart || 0) + (pDel || 0) + (pCour || 0));
    };
    refreshBadges();
    const ch = supabase.channel("admin-shell-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, refreshBadges)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, refreshBadges)
      .on("postgres_changes", { event: "*", schema: "public", table: "courier_applications" }, refreshBadges)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/admin");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground animate-pulse">Verificando acesso...</div>
      </div>
    );
  }

  const initials = (adminEmail || "A").slice(0, 2).toUpperCase();

  const groups = NAV.reduce<Record<string, NavItem[]>>((acc, it) => {
    const key = it.group || "Geral";
    (acc[key] = acc[key] || []).push(it);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[hsl(40,33%,98%)] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border/70 flex flex-col transition-transform duration-200 shadow-sm md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(142,71%,45%)] to-[hsl(160,70%,38%)] flex items-center justify-center text-white font-black text-base shadow-md shadow-primary/25">
              B
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-none">Bocadex</p>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest">ADMIN PANEL</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 mb-1.5">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />
                          )}
                          <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="flex-1">{item.label}</span>
                          {item.label === "Pedidos" && pendingCount > 0 && (
                            <span className="bg-[hsl(24,95%,53%)] text-white text-[10px] font-black px-1.5 rounded-full min-w-[18px] text-center">
                              {pendingCount}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border/60 p-3 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[hsl(160,70%,38%)] text-white flex items-center justify-center font-black text-xs shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{adminEmail}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl py-2 transition-colors"
          >
            <LogOut size={12} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur border-b border-border px-4 md:px-6 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu size={18} />
          </button>
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${
              systemOk ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  systemOk ? "bg-green-500" : "bg-red-500"
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  systemOk ? "bg-green-500" : "bg-red-500"
                }`} />
              </span>
              <Activity size={11} />
              {systemOk ? "Sistema operacional" : "Indisponível"}
            </div>
            <AdminNotificationCenter />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const current = NAV.find((n) => n.to === location.pathname) || NAV[0];
  const Icon = current.icon;
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground hidden sm:inline">Admin</span>
      <ChevronRight size={14} className="text-muted-foreground hidden sm:inline" />
      <Icon size={14} className="text-primary" />
      <span className="font-bold text-foreground">{current.label}</span>
    </div>
  );
}