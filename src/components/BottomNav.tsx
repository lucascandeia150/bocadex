import { Home, Search, Package, User, Heart } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

const tabs = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/pedidos", label: "Pedidos", icon: Package, badge: true },
  { to: "/perfil?tab=favoritos", label: "Favoritos", icon: Heart },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const { totalItems } = useCart();
  const location = useLocation();

  // Hide on admin/portal routes for cleaner UX
  if (
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/portal")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background no-blur border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full bg-primary" />
                  )}
                  <div className="relative">
                    <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                    {tab.badge && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(142,70%,45%)] text-white text-[10px] font-black flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isActive ? "font-black" : "font-semibold"}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}