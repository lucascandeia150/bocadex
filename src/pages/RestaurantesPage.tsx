import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Store, UtensilsCrossed, Coffee, Truck, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Restaurant {
  id: string;
  name: string;
  type: "restaurante" | "lanchonete" | "marmitaria" | "cafeteria";
  distance: string;
  priceRange: "barato" | "médio" | "caro";
  emoji: string;
  specialty: string;
  lat: number;
  lng: number;
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

const fallbackLocation = { lat: -23.5505, lng: -46.6333 };

const baseRestaurants: Omit<Restaurant, "lat" | "lng">[] = [
  { id: "1", name: "Cantina da Vó", type: "marmitaria", distance: "0.8 km", priceRange: "barato", emoji: "🍛", specialty: "Marmitas caseiras" },
  { id: "2", name: "Burger House", type: "lanchonete", distance: "1.2 km", priceRange: "médio", emoji: "🍔", specialty: "Hambúrgueres artesanais" },
  { id: "3", name: "Sabor & Arte", type: "restaurante", distance: "1.5 km", priceRange: "médio", emoji: "🍽️", specialty: "Comida brasileira" },
  { id: "4", name: "Café Central", type: "cafeteria", distance: "0.5 km", priceRange: "barato", emoji: "☕", specialty: "Cafés e lanches rápidos" },
  { id: "5", name: "Pizza do Bairro", type: "restaurante", distance: "2.0 km", priceRange: "médio", emoji: "🍕", specialty: "Pizzas e massas" },
  { id: "6", name: "Marmitex Express", type: "marmitaria", distance: "0.3 km", priceRange: "barato", emoji: "🥡", specialty: "Marmitas a partir de R$12" },
  { id: "7", name: "Açaí Tropical", type: "lanchonete", distance: "1.8 km", priceRange: "médio", emoji: "🫐", specialty: "Açaí e sucos naturais" },
  { id: "8", name: "Gourmet Steak", type: "restaurante", distance: "3.2 km", priceRange: "caro", emoji: "🥩", specialty: "Carnes nobres e vinhos" },
];

const offsets = [
  { dlat: 0.003, dlng: 0.002 },
  { dlat: -0.005, dlng: 0.004 },
  { dlat: 0.006, dlng: -0.003 },
  { dlat: -0.002, dlng: -0.005 },
  { dlat: 0.008, dlng: 0.001 },
  { dlat: -0.001, dlng: 0.007 },
  { dlat: 0.004, dlng: -0.006 },
  { dlat: -0.007, dlng: -0.002 },
];

function generateNearbyRestaurants(lat: number, lng: number): Restaurant[] {
  return baseRestaurants.map((restaurant, index) => ({
    ...restaurant,
    lat: lat + offsets[index].dlat,
    lng: lng + offsets[index].dlng,
  }));
}

function createEmojiIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="font-size:26px;line-height:1;text-align:center;transform:translateY(-2px)">${emoji}</div>`,
    className: "restaurant-emoji-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24],
  });
}

function createUserIcon() {
  return L.divIcon({
    html: '<div style="width:18px;height:18px;border-radius:9999px;background:#22c55e;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.2)"></div>',
    className: "user-location-marker",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function RestaurantesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState(fallbackLocation);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationMessage, setLocationMessage] = useState("Para mostrar opções próximas, precisamos acessar sua localização 📍");

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const restaurants = useMemo(
    () => generateNearbyRestaurants(userLocation.lat, userLocation.lng),
    [userLocation],
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Seu navegador não suporta localização. Mostrando opções próximas simuladas.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage("Mostrando opções simuladas perto de você 📍");
        setLoadingLocation(false);
      },
      () => {
        setLocationMessage("Não conseguimos acessar sua localização. Mostrando opções próximas simuladas.");
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  }, []);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([userLocation.lat, userLocation.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      markerLayerRef.current?.clearLayers();
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });

    L.marker([userLocation.lat, userLocation.lng], { icon: createUserIcon() })
      .bindPopup("Você está aqui 📍")
      .addTo(markerLayer);

    restaurants.forEach((restaurant) => {
      const popupHtml = `
        <div style="min-width:150px">
          <div style="font-weight:700;margin-bottom:4px">${restaurant.emoji} ${restaurant.name}</div>
          <div style="font-size:12px;opacity:.75;margin-bottom:6px">${restaurant.specialty}</div>
          <div style="font-size:12px">${restaurant.distance} • ${priceLabels[restaurant.priceRange]}</div>
        </div>
      `;

      L.marker([restaurant.lat, restaurant.lng], { icon: createEmojiIcon(restaurant.emoji) })
        .bindPopup(popupHtml)
        .on("click", () => setSelected(restaurant))
        .addTo(markerLayer);
    });
  }, [restaurants, userLocation]);

  const handleView = (restaurant: Restaurant) => {
    setSelected(restaurant);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (selected) {
      setDialogOpen(true);
    }
  }, [selected]);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-center mb-6 animate-bounce-in">
        <MapPin className="mx-auto text-secondary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Restaurantes Próximos</h1>
        <p className="text-muted-foreground text-sm mt-1">Opções perto de você 📍</p>
      </div>

      <div className="max-w-sm mx-auto mb-4 bg-accent/60 rounded-xl p-4 text-center animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-1">
          <LocateFixed className={loadingLocation ? "text-primary animate-pulse" : "text-primary"} size={16} />
          <p className="text-sm font-semibold text-foreground">Localização</p>
        </div>
        <p className="text-xs text-muted-foreground">{locationMessage}</p>
      </div>

      <div className="max-w-sm mx-auto mb-4 bg-accent/60 rounded-xl p-3 text-center animate-slide-up">
        <p className="text-xs text-muted-foreground">
          📌 Lista simulada — os valores e distâncias são estimativas e podem variar
        </p>
      </div>

      <div className="max-w-sm mx-auto mb-5 animate-slide-up">
        <div ref={mapElementRef} className="h-72 w-full rounded-2xl border border-border shadow-md overflow-hidden" />
      </div>

      <div className="max-w-sm mx-auto flex flex-col gap-3">
        {restaurants.map((restaurant, index) => (
          <div
            key={restaurant.id}
            className="rounded-2xl bg-card border border-border shadow-md p-4 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-4xl">{restaurant.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground">{restaurant.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{restaurant.specialty}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                    {typeIcons[restaurant.type]} {typeLabels[restaurant.type]}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {restaurant.distance}
                  </span>
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${priceColors[restaurant.priceRange]}`}>
                    {priceLabels[restaurant.priceRange]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleView(restaurant)}
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
