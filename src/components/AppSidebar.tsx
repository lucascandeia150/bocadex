import { Home, UtensilsCrossed, Phone, Star, Info, Rocket, Search, Truck, Settings, Compass, Store } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const userItems = [
  { title: "Início", url: "/", icon: Home, emoji: "🏠" },
  { title: "Explorar lojas", url: "/lojas", icon: UtensilsCrossed, emoji: "🍽️" },
  { title: "Buscar", url: "/buscar", icon: Search, emoji: "🔍" },
  { title: "Descobrir", url: "/descobrir-hub", icon: Compass, emoji: "🍽️" },
];

const growthItems = [
  { title: "Quero ser parceiro", url: "/seja-parceiro", icon: Rocket, emoji: "🚀" },
  { title: "Seja um Entregador", url: "/seja-entregador", icon: Truck, emoji: "🚚" },
];

const partnerItems = [
  { title: "Portal Loja", desc: "Gerenciar pedidos e entregas", url: "/portal/loja", icon: Store, emoji: "🏪" },
  { title: "Portal Entregador", desc: "Visualizar e aceitar entregas", url: "/portal/entregador", icon: Truck, emoji: "🚚" },
];

const otherItems = [
  { title: "Contato", url: "/contato", icon: Phone, emoji: "📞" },
  { title: "Sobre o app", url: "/sobre", icon: Info, emoji: "ℹ️" },
  { title: "Avaliar app", url: "/avaliar", icon: Star, emoji: "⭐" },
];

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const navigate = useNavigate();

  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleAdminClick = () => {
    handleClick();
    navigate("/admin");
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logo} alt="EscolheAí" className="w-10 h-10 rounded-xl" />
          <span className="text-lg font-black text-sidebar-foreground">EscolheAí</span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            👤 Usuário
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 px-3 py-2.5 rounded-xl transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-bold"
                      onClick={handleClick}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-semibold">
                        {item.emoji} {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-1 border-t border-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            💼 Crescimento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {growthItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 px-3 py-2.5 rounded-xl transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-bold"
                      onClick={handleClick}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-semibold">
                        {item.emoji} {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-1 border-t border-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            🔐 Área do parceiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {partnerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto">
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 px-3 py-2 rounded-xl transition-colors flex items-start"
                      activeClassName="bg-sidebar-accent text-primary font-bold"
                      onClick={handleClick}
                    >
                      <item.icon className="mr-3 mt-0.5 h-5 w-5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">
                          {item.emoji} {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-1 border-t border-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            ⚙️ Outros
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 px-3 py-2.5 rounded-xl transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-bold"
                      onClick={handleClick}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-semibold">
                        {item.emoji} {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-sidebar-border">
          <button
            onClick={handleAdminClick}
            className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/30 transition-colors"
            aria-label="Acesso administrativo"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Admin</span>
          </button>
          <p className="text-[10px] text-muted-foreground text-center pb-3 px-4">
            © 2026 EscolheAí
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
