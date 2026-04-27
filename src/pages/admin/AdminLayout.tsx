import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, ShoppingBag, Store, Package, Users, DollarSign, Star,
  Settings, ScrollText, LogOut, Bell, Menu, X, Activity, ChevronRight,
  type LucideIcon
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/dashboard/orders", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/dashboard/stores", label: "Lojas", icon: Store },
  { to: "/admin/dashboard/products", label: "Produtos", icon: Package },
  { to: "/admin/dashboard/customers", label: "Clientes", icon: Users },
  { to: "/admin/dashboard/finance", label: "Financeiro", icon: DollarSign },
  { to: "/admin/dashboard/reviews", label: "Avaliações", icon: Star },
  { to: "/admin/dashboard/settings", label: "Configurações", icon: Settings },
  { to: "/admin/dashboard/logs", label: "Logs / Auditoria", icon: ScrollText },
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
      const [{ count: pPart }, { count: pDel }] = await Promise.all([
        supabase.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "disponivel"),
      ]);
      setPendingCount((pPart || 0) + (pDel || 0));
    };
    refreshBadges();
    const ch = supabase.channel("admin-shell-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_applications" }, refreshBadges)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, refreshBadges)
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

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-black text-sm">
              E
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-none">EscolheAí</p>
              <p className="text-[10px] text-muted-foreground font-bold">ADMIN</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.label === "Pedidos" && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-1.5 rounded-full min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground truncate">{adminEmail}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg py-2 transition-colors"
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
            <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Notificações">
              <Bell size={16} />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
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