import { useState } from "react";
import { MapPin, Store, UtensilsCrossed, Coffee, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Restaurant {
  id: string;
  name: string;
  type: "restaurante" | "lanchonete" | "marmitaria" | "cafeteria";
  distance: string;
  priceRange: "barato" | "médio" | "caro";
  emoji: string;
  specialty: string;
}

const typeLabels: Record<Restaurant["type"], string> = {
  restaurante: "Restaurante",
  lanchonete: "Lanchonete",
  marmitaria: "Marmitaria",
  cafeteria: "Cafeteria",
};

const typeIcons: Record<Restaurant["type"], React.ReactNode> = {
  restaurante: <UtensilsCrossed size={14} />,
  lanchonete: <Store size={14} />,
  marmitaria: <Truck size={14} />,
  cafeteria: <Coffee size={14} />,
};

const priceColors: Record<Restaurant["priceRange"], string> = {
  barato: "bg-primary/15 text-primary",
  médio: "bg-secondary/15 text-secondary",
  caro: "bg-destructive/15 text-destructive",
};

const priceLabels: Record<Restaurant["priceRange"], string> = {
  barato: "💚 Barato",
  médio: "🧡 Médio",
  caro: "💎 Caro",
};

const simulatedRestaurants: Restaurant[] = [
  { id: "1", name: "Cantina da Vó", type: "marmitaria", distance: "0.8 km", priceRange: "barato", emoji: "🍛", specialty: "Marmitas caseiras" },
  { id: "2", name: "Burger House", type: "lanchonete", distance: "1.2 km", priceRange: "médio", emoji: "🍔", specialty: "Hambúrgueres artesanais" },
  { id: "3", name: "Sabor & Arte", type: "restaurante", distance: "1.5 km", priceRange: "médio", emoji: "🍽️", specialty: "Comida brasileira" },
  { id: "4", name: "Café Central", type: "cafeteria", distance: "0.5 km", priceRange: "barato", emoji: "☕", specialty: "Cafés e lanches rápidos" },
  { id: "5", name: "Pizza do Bairro", type: "restaurante", distance: "2.0 km", priceRange: "médio", emoji: "🍕", specialty: "Pizzas e massas" },
  { id: "6", name: "Marmitex Express", type: "marmitaria", distance: "0.3 km", priceRange: "barato", emoji: "🥡", specialty: "Marmitas a partir de R$12" },
  { id: "7", name: "Açaí Tropical", type: "lanchonete", distance: "1.8 km", priceRange: "médio", emoji: "🫐", specialty: "Açaí e sucos naturais" },
  { id: "8", name: "Gourmet Steak", type: "restaurante", distance: "3.2 km", priceRange: "caro", emoji: "🥩", specialty: "Carnes nobres e vinhos" },
];

export default function RestaurantesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const handleView = (r: Restaurant) => {
    setSelected(r);
    setDialogOpen(true);
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <MapPin className="mx-auto text-secondary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Restaurantes Próximos</h1>
        <p className="text-muted-foreground text-sm mt-1">Opções perto de você 📍</p>
      </div>

      <div className="max-w-sm mx-auto mb-4 bg-accent/60 rounded-xl p-3 text-center animate-slide-up">
        <p className="text-xs text-muted-foreground">
          📌 Lista simulada — os valores e distâncias são estimativas e podem variar
        </p>
      </div>

      <div className="max-w-sm mx-auto flex flex-col gap-3">
        {simulatedRestaurants.map((r, i) => (
          <div
            key={r.id}
            className="rounded-2xl bg-card border border-border shadow-md p-4 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{r.specialty}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                    {typeIcons[r.type]} {typeLabels[r.type]}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {r.distance}
                  </span>
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${priceColors[r.priceRange]}`}>
                    {priceLabels[r.priceRange]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleView(r)}
                className="gradient-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform whitespace-nowrap"
              >
                Ver opção
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Store size={22} className="text-secondary" />
              {selected?.emoji} {selected?.name}
            </DialogTitle>
            <DialogDescription>{selected?.specialty}</DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <span className="text-4xl block mb-3">😕</span>
            <p className="text-foreground font-bold text-lg">
              Ainda não temos parceria com este restaurante
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve você poderá ver o cardápio e pedir direto pelo app! 🚀
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(false)}
            className="w-full bg-muted text-foreground font-bold py-3 rounded-2xl active:scale-95 transition-transform"
          >
            Entendi
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
