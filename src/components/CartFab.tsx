import { ShoppingCart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";

export function CartFab() {
  const { totalItems, totalValue } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  if (totalItems === 0) return null;
  if (location.pathname === "/carrinho") return null;

  return (
    <button
      onClick={() => navigate("/carrinho")}
      className="fixed bottom-24 right-4 z-50 bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 active:scale-95 transition-all animate-slide-up"
      aria-label="Abrir carrinho"
    >
      <div className="relative">
        <ShoppingCart size={22} />
        <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {totalItems}
        </span>
      </div>
      <div className="text-left">
        <p className="text-[10px] font-bold leading-none opacity-90">Ver carrinho</p>
        <p className="text-sm font-black leading-tight">R${totalValue.toFixed(2)}</p>
      </div>
    </button>
  );
}
