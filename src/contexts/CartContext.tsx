import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  partnerId: string;
  partnerName: string;
  partnerWhatsapp: string;
  partnerHasDelivery: boolean;
}

interface CartContextValue {
  items: CartItem[];
  partnerId: string | null;
  partnerName: string | null;
  partnerWhatsapp: string | null;
  partnerHasDelivery: boolean;
  totalItems: number;
  totalValue: number;
  addItem: (item: CartItem) => { ok: boolean; replacedPartner?: boolean };
  forceAddItem: (item: CartItem) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "escolheai_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const partner = items[0] ?? null;

  const addItem = useCallback((item: CartItem) => {
    let replacedPartner = false;
    setItems((prev) => {
      // se carrinho de outra loja, bloqueia
      if (prev.length > 0 && prev[0].partnerId !== item.partnerId) {
        replacedPartner = true;
        return prev; // não muda — quem chamou decide trocar
      }
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + item.quantity, notes: item.notes ?? p.notes }
            : p,
        );
      }
      return [...prev, item];
    });
    return { ok: !replacedPartner, replacedPartner };
  }, []);

  const forceAddItem = useCallback((item: CartItem) => {
    setItems([item]);
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.productId === productId ? { ...p, quantity: Math.max(0, qty) } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        partnerId: partner?.partnerId ?? null,
        partnerName: partner?.partnerName ?? null,
        partnerWhatsapp: partner?.partnerWhatsapp ?? null,
        partnerHasDelivery: partner?.partnerHasDelivery ?? false,
        totalItems,
        totalValue,
        addItem,
        forceAddItem,
        updateQty,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
