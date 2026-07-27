"use client";

import { useEffect, useRef, useState } from "react";

export type MapMarker = {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  size?: number;
  popup?: string;
};

export type MapConfig = {
  mapProvider: string;
  googleMapsApiKey: string;
  mapboxAccessToken: string;
  defaultZoom: number;
  centerLat: number;
  centerLng: number;
};

type Props = {
  markers?: MapMarker[];
  polyline?: { lat: number; lng: number }[];
  height?: number;
  zoom?: number;
  center?: { lat: number; lng: number };
  fitBounds?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
};

declare global {
  interface Window {
    L?: any;
  }
}

export default function LiveMap({
  markers = [],
  polyline = [],
  height = 460,
  zoom,
  center,
  fitBounds = true,
  onMarkerClick,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const layerGroup = useRef<any>(null);
  const [config, setConfig] = useState<MapConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // 1. Carregar configuração do admin
  useEffect(() => {
    fetch("/api/config/maps")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() =>
        setConfig({
          mapProvider: "openstreetmap",
          googleMapsApiKey: "",
          mapboxAccessToken: "",
          defaultZoom: 4,
          centerLat: -15.7801,
          centerLng: -47.9292,
        })
      );
  }, []);

  // 2. Carregar Leaflet do CDN
  useEffect(() => {
    if (!config) return;
    if (window.L) { setReady(true); return; }

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError("Não foi possível carregar a biblioteca de mapas.");
    document.body.appendChild(script);
  }, [config]);

  // 3. Inicializar e atualizar o mapa
  useEffect(() => {
    if (!ready || !config || !mapRef.current || !window.L) return;
    const L = window.L;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [center?.lat ?? config.centerLat, center?.lng ?? config.centerLng],
        zoom: zoom ?? config.defaultZoom,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      // Escolher camada de tiles conforme provedor configurado no admin
      let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      let attribution = "&copy; OpenStreetMap";

      if (config.mapProvider === "mapbox" && config.mapboxAccessToken) {
        tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapboxAccessToken}`;
        attribution = "&copy; Mapbox &copy; OpenStreetMap";
      } else if (config.mapProvider === "google" && config.googleMapsApiKey) {
        tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
        attribution = "&copy; Google Maps";
      } else {
        // CartoDB tiles (grátis, visual moderno) como padrão
        tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        attribution = "&copy; OpenStreetMap &copy; CARTO";
      }

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(mapInstance.current);
      layerGroup.current = L.layerGroup().addTo(mapInstance.current);
    }

    // Limpar marcadores anteriores
    layerGroup.current?.clearLayers();

    const bounds: [number, number][] = [];

    // Desenhar rota
    if (polyline.length > 1) {
      const latlngs = polyline.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(latlngs, { color: "#f97316", weight: 4, opacity: 0.75, dashArray: "8, 8" }).addTo(layerGroup.current);
      latlngs.forEach((c) => bounds.push(c));
    }

    // Desenhar marcadores
    markers.forEach((m) => {
      const size = m.size || 28;
      const color = m.color || "#f97316";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,.4);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-weight:800;font-size:${Math.round(size / 2.6)}px;
          font-family:system-ui,sans-serif;">${m.label || ""}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layerGroup.current);
      if (m.popup) marker.bindPopup(m.popup);
      if (onMarkerClick) marker.on("click", () => onMarkerClick(m));
      bounds.push([m.lat, m.lng]);
    });

    if (fitBounds && bounds.length > 0) {
      try {
        mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } catch {}
    } else if (center) {
      mapInstance.current.setView([center.lat, center.lng], zoom ?? config.defaultZoom);
    }
  }, [ready, config, markers, polyline, center, zoom, fitBounds, onMarkerClick]);

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center px-6">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Verifique sua conexão ou as configurações em /admin/integracoes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div ref={mapRef} style={{ height, width: "100%", background: "#0f172a" }} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: 3 }} />
            <p className="mt-3 text-sm text-slate-300 font-medium">Carregando mapa interativo...</p>
          </div>
        </div>
      )}
    </div>
  );
}
