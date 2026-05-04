import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/useMapboxToken";

interface Props {
  storeAddress?: string | null;
  deliveryAddress?: string | null;
  height?: number;
}

async function geocode(token: string, query: string): Promise<[number, number] | null> {
  if (!query?.trim()) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=br&limit=1`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const c = j?.features?.[0]?.center;
    return Array.isArray(c) && c.length === 2 ? [c[0], c[1]] : null;
  } catch { return null; }
}

export function OrderTrackingMap({ storeAddress, deliveryAddress, height = 220 }: Props) {
  const { token, error } = useMapboxToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      mapboxgl.accessToken = token;
      const [store, dest] = await Promise.all([
        storeAddress ? geocode(token, storeAddress) : Promise.resolve(null),
        deliveryAddress ? geocode(token, deliveryAddress) : Promise.resolve(null),
      ]);
      if (cancelled || !containerRef.current) return;

      const center = store ?? dest ?? [-43.9352, -19.9208]; // BH fallback
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center,
        zoom: 13,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        const bounds = new mapboxgl.LngLatBounds();
        if (store) {
          new mapboxgl.Marker({ color: "#f97316" }).setLngLat(store).setPopup(new mapboxgl.Popup().setText("Loja")).addTo(map);
          bounds.extend(store);
        }
        if (dest) {
          new mapboxgl.Marker({ color: "#16a34a" }).setLngLat(dest).setPopup(new mapboxgl.Popup().setText("Entrega")).addTo(map);
          bounds.extend(dest);
        }
        if (store && dest) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 0 });
        }
        setLoading(false);
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, storeAddress, deliveryAddress]);

  if (error) {
    return <div className="text-[11px] text-muted-foreground p-2">Mapa indisponível</div>;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-muted/40 text-[11px] text-muted-foreground">
          Carregando mapa...
        </div>
      )}
    </div>
  );
}