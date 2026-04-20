import { Home, UtensilsCrossed, ChefHat, Phone, Star, Info, Rocket, Search, Truck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Início", url: "/", icon: Home, emoji: "🏠" },
  { title: "Explorar lojas", url: "/lojas", icon: UtensilsCrossed, emoji: "🍽️" },
  { title: "Sugestão do dia", url: "/descobrir", icon: Rocket, emoji: "🎲" },
  { title: "Receitas", url: "/receitas", icon: ChefHat, emoji: "🍳" },
  { title: "Buscar", url: "/buscar", icon: Search, emoji: "🔍" },
  { title: "Contato", url: "/contato", icon: Phone, emoji: "📞" },
  { title: "Avaliar app", url: "/avaliar", icon: Star, emoji: "⭐" },
  { title: "Sobre o app", url: "/sobre", icon: Info, emoji: "ℹ️" },
  { title: "Quero ser parceiro", url: "/seja-parceiro", icon: Rocket, emoji: "🚀" },
  { title: "Seja um Entregador", url: "/seja-entregador", icon: Truck, emoji: "🚚" },
];

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logo} alt="EscolheAí" className="w-10 h-10 rounded-xl" />
          <span className="text-lg font-black text-sidebar-foreground">EscolheAí</span>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground text-center">
            © 2026 EscolheAí
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
