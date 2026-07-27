"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LiveMap, { type MapMarker } from "@/components/LiveMap";
import { IcTruck, IcPin, IcRefresh, IcCheck, IcClock } from "@/components/Icons";

type TrackingData = {
  position: { lat: number; lng: number };
  progress: number;
  origin: { state: string; coords: [number, number] };
  destination: { state: string; coords: [number, number] };
  estimatedETA: string;
  lastUpdated: string;
  speedKmh: number;
};

type RealPosition = {
  lat: number; lng: number; speedKmh: number | null; accuracy: number | null;
  source: string; driverName: string; createdAt: string;
};

type MapCfg = { trackingEnabled: boolean; trackingIntervalSeconds: number; trackingMode: string };

export default function RastrearPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<TrackingData | null>(null);
  const [realPositions, setRealPositions] = useState<RealPosition[]>([]);
  const [cfg, setCfg] = useState<MapCfg>({ trackingEnabled: true, trackingIntervalSeconds: 30, trackingMode: "browser" });
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const watchId = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [simRes, realRes] = await Promise.all([
        fetch(`/api/tracking/${id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/tracking/${id}/position`).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (simRes) setData(simRes);
      if (realRes) setRealPositions(realRes.positions || []);
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch("/api/config/maps").then((r) => r.json()).then((c) => setCfg({
      trackingEnabled: c.trackingEnabled ?? true,
      trackingIntervalSeconds: c.trackingIntervalSeconds ?? 30,
      trackingMode: c.trackingMode ?? "browser",
    })).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, [refresh]);

  // Motorista compartilha GPS real do celular
  function startSharing() {
    if (!navigator.geolocation) { setGpsError("Seu dispositivo não suporta GPS."); return; }
    setGpsError("");
    setSharing(true);

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await fetch(`/api/tracking/${id}/position`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              speedKmh: pos.coords.speed ? pos.coords.speed * 3.6 : null,
              heading: pos.coords.heading,
              source: "gps",
            }),
          });
          setSentCount((c) => c + 1);
          refresh();
        } catch {}
      },
      (err) => {
        setGpsError(err.code === 1 ? "Permissão de localização negada. Autorize no navegador." : "Não foi possível obter sua localização.");
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  }

  function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
  }

  useEffect(() => () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); }, []);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando rastreamento...</div>;

  if (!data) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <IcPin className="w-12 h-12 text-slate-300 mx-auto" />
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Frete não encontrado</h1>
      <Link href="/fretes" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Buscar fretes</Link>
    </div>
  );

  const hasReal = realPositions.length > 0;
  const latest = realPositions[0];
  const current = hasReal ? { lat: latest.lat, lng: latest.lng } : data.position;

  const markers: MapMarker[] = [
    { lat: data.origin.coords[0], lng: data.origin.coords[1], label: "A", color: "#3b82f6", size: 34, popup: `<strong>Origem: ${data.origin.state}</strong>` },
    { lat: data.destination.coords[0], lng: data.destination.coords[1], label: "B", color: "#ef4444", size: 34, popup: `<strong>Destino: ${data.destination.state}</strong>` },
    {
      lat: current.lat, lng: current.lng, label: "", color: "#f97316", size: 40,
      popup: `<div style="font-family:system-ui"><strong>Posição atual</strong><br/>
        ${hasReal ? `GPS real · ${latest.driverName}` : "Simulado"}<br/>
        ${hasReal && latest.speedKmh ? `${latest.speedKmh.toFixed(0)} km/h` : `${data.speedKmh} km/h`}</div>`,
    },
  ];

  const routeLine = hasReal && realPositions.length > 1
    ? [...realPositions].reverse().map((p) => ({ lat: p.lat, lng: p.lng }))
    : [
        { lat: data.origin.coords[0], lng: data.origin.coords[1] },
        { lat: current.lat, lng: current.lng },
        { lat: data.destination.coords[0], lng: data.destination.coords[1] },
      ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={`/fretes/${id}`} className="text-sm text-orange-600 font-semibold hover:underline">← Voltar ao frete</Link>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <IcRefresh className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
          <IcTruck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Rastreamento em Tempo Real</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Frete #{id} · {data.origin.state} → {data.destination.state}
            {hasReal ? (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> GPS ao vivo
              </span>
            ) : (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-bold text-xs">Modo estimado</span>
            )}
          </p>
        </div>
      </div>

      {/* Mapa real */}
      <div className="mt-5">
        <LiveMap markers={markers} polyline={routeLine} height={440} fitBounds />
      </div>

      {/* Progresso */}
      <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-bold text-slate-900 dark:text-white">Progresso da viagem</span>
          <span className="font-bold text-orange-500">{data.progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${data.progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            ["Progresso", `${data.progress}%`],
            ["Velocidade", hasReal && latest.speedKmh ? `${latest.speedKmh.toFixed(0)} km/h` : `~${data.speedKmh} km/h`],
            ["Previsão", data.estimatedETA],
            ["Pontos GPS", String(realPositions.length)],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{label}</p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compartilhar GPS (motorista) */}
      {cfg.trackingEnabled && cfg.trackingMode === "browser" && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <IcPin className="w-4 h-4 text-orange-500" /> Sou o motorista deste frete
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compartilhe sua localização em tempo real para que o embarcador acompanhe a entrega.
                A posição é enviada automaticamente enquanto esta página estiver aberta.
              </p>
              {gpsError && <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">{gpsError}</p>}
              {sharing && (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Transmitindo · {sentCount} {sentCount === 1 ? "posição enviada" : "posições enviadas"}
                </p>
              )}
            </div>
            {sharing ? (
              <button onClick={stopSharing} className="shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Parar transmissão
              </button>
            ) : (
              <button onClick={startSharing} className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Compartilhar GPS
              </button>
            )}
          </div>
        </div>
      )}

      {/* Histórico */}
      {hasReal && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <IcClock className="w-4 h-4 text-slate-400" /> Últimas posições registradas
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {realPositions.slice(0, 12).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </span>
                <span className="text-slate-400">
                  {p.speedKmh ? `${p.speedKmh.toFixed(0)} km/h · ` : ""}
                  {new Date(p.createdAt).toLocaleTimeString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasReal && (
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Nenhuma posição GPS real registrada ainda. O mapa mostra uma estimativa baseada na rota.
        </p>
      )}
    </div>
  );
}
