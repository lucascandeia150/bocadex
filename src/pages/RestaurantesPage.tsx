import { useState, useEffect, useRef } from "react";
import { MapPin, Store, UtensilsCrossed, Coffee, Truck, Navigation, Locate } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

const createEmojiIcon = (emoji: string) =>
  L.divIcon({
    html: `<div style="font-size:28px;text-align:center;line-height:1">${emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });

const userIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:hsl(142,71%,45%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Generate simulated restaurants near user location
function generateNearbyRestaurants(lat: number, lng: number): Restaurant[] {
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

  const base: Omit<Restaurant, "lat" | "lng">[] = [
    { id: "1", name: "Cantina da Vó", type: "marmitaria", distance: "0.8 km", priceRange: "barato", emoji: "🍛", specialty: "Marmitas caseiras" },
    { id: "2", name: "Burger House", type: "lanchonete", distance: "1.2 km", priceRange: "médio", emoji: "🍔", specialty: "Hambúrgueres artesanais" },
    { id: "3", name: "Sabor & Arte", type: "restaurante", distance: "1.5 km", priceRange: "médio", emoji: "🍽️", specialty: "Comida brasileira" },
    { id: "4", name: "Café Central", type: "cafeteria", distance: "0.5 km", priceRange: "barato", emoji: "☕", specialty: "Cafés e lanches rápidos" },
    { id: "5", name: "Pizza do Bairro", type: "restaurante", distance: "2.0 km", priceRange: "médio", emoji: "🍕", specialty: "Pizzas e massas" },
    { id: "6", name: "Marmitex Express", type: "marmitaria", distance: "0.3 km", priceRange: "barato", emoji: "🥡", specialty: "Marmitas a partir de R$12" },
    { id: "7", name: "Açaí Tropical", type: "lanchonete", distance: "1.8 km", priceRange: "médio", emoji: "🫐", specialty: "Açaí e sucos naturais" },
    { id: "8", name: "Gourmet Steak", type: "restaurante", distance: "3.2 km", priceRange: "caro", emoji: "🥩", specialty: "Carnes nobres e vinhos" },
  ];

  return base.map((r, i) => ({
    ...r,
    lat: lat + offsets[i].dlat,
    lng: lng + offsets[i].dlng,
  }));
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

type ViewMode = "map" | "list";

export default function RestaurantesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [view, setView] = useState<ViewMode>("map");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Seu navegador não suporta geolocalização");
      setLoading(false);
      // Fallback: São Paulo center
      const fallback = { lat: -23.5505, lng: -46.6333 };
      setUserPos(fallback);
      setRestaurants(generateNearbyRestaurants(fallback.lat, fallback.lng));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setRestaurants(generateNearbyRestaurants(coords.lat, coords.lng));
        setLoading(false);
      },
      () => {
        setLocError("Não foi possível acessar sua localização");
        setLoading(false);
        const fallback = { lat: -23.5505, lng: -46.6333 };
        setUserPos(fallback);
        setRestaurants(generateNearbyRestaurants(fallback.lat, fallback.lng));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleView = (r: Restaurant) => {
    setSelected(r);
    setDialogOpen(true);
  };

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="text-center mb-4 animate-bounce-in">
        <MapPin className="mx-auto text-secondary mb-2" size={32} />
        <h1 className="text-2xl font-black text-foreground">Restaurantes Próximos</h1>
        <p className="text-muted-foreground text-sm mt-1">Opções perto de você 📍</p>
      </div>

      {/* Location status */}
      {loading && (
        <div className="max-w-sm mx-auto mb-4 bg-accent/60 rounded-xl p-4 text-center animate-pulse">
          <Locate className="mx-auto text-primary mb-2 animate-spin" size={24} />
          <p className="text-sm text-foreground font-semibold">Buscando sua localização...</p>
          <p className="text-xs text-muted-foreground mt-1">Para mostrar opções próximas, precisamos acessar sua localização 📍</p>
        </div>
      )}

      {locError && (
        <div className="max-w-sm mx-auto mb-4 bg-secondary/10 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">⚠️ {locError} — mostrando região padrão (São Paulo)</p>
        </div>
      )}

      {/* View toggle */}
      {!loading && (
        <div className="max-w-sm mx-auto flex gap-2 mb-4 animate-slide-up">
          <button
            onClick={() => setView("map")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              view === "map"
                ? "gradient-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            🗺️ Mapa
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              view === "list"
                ? "gradient-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            📋 Lista
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-sm mx-auto mb-4 bg-accent/60 rounded-xl p-3 text-center animate-slide-up">
        <p className="text-xs text-muted-foreground">
          📌 Lista simulada — os valores e distâncias são estimativas e podem variar
        </p>
      </div>

      {/* Map View */}
      {!loading && userPos && view === "map" && (
        <div className="max-w-sm mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg border border-border animate-slide-up" style={{ height: 320 }}>
          <MapContainer
            center={[userPos.lat, userPos.lng]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToLocation lat={userPos.lat} lng={userPos.lng} />

            {/* User marker */}
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup>
                <span className="font-bold">Você está aqui 📍</span>
              </Popup>
            </Marker>

            {/* Restaurant markers */}
            {restaurants.map((r) => (
              <Marker key={r.id} position={[r.lat, r.lng]} icon={createEmojiIcon(r.emoji)}>
                <Popup>
                  <div className="text-center min-w-[140px]">
                    <p className="font-bold text-sm">{r.emoji} {r.name}</p>
                    <p className="text-xs text-gray-500">{r.specialty}</p>
                    <p className="text-xs mt-1">{r.distance} • {priceLabels[r.priceRange]}</p>
                    <button
                      onClick={() => handleView(r)}
                      className="mt-2 text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: "hsl(142,71%,45%)", color: "white" }}
                    >
                      Ver opção
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* List View */}
      {!loading && view === "list" && (
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          {restaurants.map((r, i) => (
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
      )}

      {/* Dialog */}
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
