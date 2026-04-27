import { Home, UtensilsCrossed, Phone, Star, Info, Rocket, Search, Truck, Settings, Compass, Store, ShieldCheck, ChevronRight, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { useAppVersion } from "@/hooks/useAppVersion";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  desc?: string;
}

const exploreItems: NavItem[] = [
  { title: "Início", url: "/", icon: Home },
  { title: "Explorar lojas", url: "/lojas", icon: UtensilsCrossed },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Descobrir", url: "/descobrir-hub", icon: Compass },
];

const growthItems: NavItem[] = [
  { title: "Quero ser parceiro", url: "/seja-parceiro", icon: Rocket, desc: "Cadastre sua loja" },
  { title: "Seja entregador", url: "/seja-entregador", icon: Truck, desc: "Trabalhe conosco" },
];

const partnerItems: NavItem[] = [
  { title: "Portal Loja", url: "/portal/loja", icon: Store, desc: "Pedidos e entregas" },
  { title: "Portal Entregador", url: "/portal/entregador", icon: Truck, desc: "Aceitar entregas" },
];

const otherItems: NavItem[] = [
  { title: "Contato", url: "/contato", icon: Phone },
  { title: "Sobre o app", url: "/sobre", icon: Info },
  { title: "Avaliar app", url: "/avaliar", icon: Star },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-4 pb-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.12em]">
      {children}
    </p>
  );
}

function Item({ item, onClick, accent }: { item: NavItem; onClick: () => void; accent?: boolean }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="h-auto p-0">
        <NavLink
          to={item.url}
          end
          onClick={onClick}
          className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all hover:bg-sidebar-accent/60 active:scale-[0.98] ${
            accent ? "border border-primary/15 bg-primary/[0.04]" : ""
          }`}
          activeClassName="!bg-primary/12 !border !border-primary/30 shadow-sm"
        >
          <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
          }`}>
            <Icon size={17} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-tight truncate">{item.title}</p>
            {item.desc && (
              <p className="text-[10.5px] text-muted-foreground truncate leading-tight mt-0.5">{item.desc}</p>
            )}
          </div>
          <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const navigate = useNavigate();
  const { version, isNew, markSeen } = useAppVersion();
  const [user, setUser] = useState<{ email: string | null; name: string | null } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? null,
          name: (data.user.user_metadata?.full_name as string) ?? (data.user.user_metadata?.name as string) ?? null,
        });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? null,
          name: (session.user.user_metadata?.full_name as string) ?? (session.user.user_metadata?.name as string) ?? null,
        });
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const close = () => { if (isMobile) setOpenMobile(false); };
  const handleAdminClick = () => { close(); navigate("/admin"); };
  const handleSignOut = async () => { await supabase.auth.signOut(); close(); navigate("/"); };

  const displayName = user?.name || user?.email?.split("@")[0] || "Visitante";
  const initials = (user?.name || user?.email || "V").trim().slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95">
        {/* Header / Brand */}
        <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EscolheAí" className="w-11 h-11 rounded-2xl shadow-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-sidebar-foreground leading-tight">EscolheAí</p>
              {version && (
                <button
                  onClick={markSeen}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <span>v{version.version}</span>
                  {isNew && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold animate-pulse">
                      NOVO
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User card */}
          <button
            onClick={() => { close(); navigate(user ? "/perfil" : "/acesso-parceiro"); }}
            className="mt-3 w-full flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-sidebar-border hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-black text-sm shadow">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] text-muted-foreground truncate">
                  {user ? "Online · ver perfil" : "Toque para entrar"}
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
          </button>
        </div>

        {/* Explore */}
        <SectionLabel>🧭 Explorar</SectionLabel>
        <SidebarMenu>
          {exploreItems.map((i) => <Item key={i.url} item={i} onClick={close} />)}
        </SidebarMenu>

        {/* Growth */}
        <SectionLabel>💼 Ganhe dinheiro</SectionLabel>
        <SidebarMenu>
          {growthItems.map((i) => <Item key={i.url} item={i} onClick={close} />)}
        </SidebarMenu>

        {/* Partner area (highlighted) */}
        <div className="flex items-center justify-between pr-3">
          <SectionLabel>🔐 Área profissional</SectionLabel>
          <span className="mt-3 mr-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
            Pro
          </span>
        </div>
        <SidebarMenu>
          {partnerItems.map((i) => <Item key={i.url} item={i} onClick={close} accent />)}
        </SidebarMenu>

        {/* Other */}
        <SectionLabel>⚙️ Outros</SectionLabel>
        <SidebarMenu>
          {otherItems.map((i) => <Item key={i.url} item={i} onClick={close} />)}
        </SidebarMenu>

        {/* Footer */}
        <div className="mt-auto border-t border-sidebar-border">
          {user && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair da conta
            </button>
          )}
          <button
            onClick={handleAdminClick}
            className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 transition-colors"
            aria-label="Acesso administrativo"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Acesso Admin</span>
          </button>
          <p className="text-[10px] text-muted-foreground text-center pb-3 px-4">
            © 2026 EscolheAí
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
