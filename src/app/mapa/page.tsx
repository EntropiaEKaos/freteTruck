"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LiveMap, { type MapMarker } from "@/components/LiveMap";
import { IcMap, IcSearch, IcRefresh } from "@/components/Icons";

type StateBucket = { state: string; total: number };

// Coordenadas geográficas reais das capitais / centro dos estados
const STATE_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  AC: { lat: -9.97, lng: -67.81, name: "Acre" },
  AL: { lat: -9.66, lng: -35.73, name: "Alagoas" },
  AP: { lat: 0.03, lng: -51.06, name: "Amapá" },
  AM: { lat: -3.12, lng: -60.02, name: "Amazonas" },
  BA: { lat: -12.97, lng: -38.51, name: "Bahia" },
  CE: { lat: -3.72, lng: -38.54, name: "Ceará" },
  DF: { lat: -15.78, lng: -47.93, name: "Distrito Federal" },
  ES: { lat: -20.32, lng: -40.34, name: "Espírito Santo" },
  GO: { lat: -16.69, lng: -49.26, name: "Goiás" },
  MA: { lat: -2.53, lng: -44.30, name: "Maranhão" },
  MT: { lat: -15.60, lng: -56.10, name: "Mato Grosso" },
  MS: { lat: -20.44, lng: -54.65, name: "Mato Grosso do Sul" },
  MG: { lat: -19.92, lng: -43.94, name: "Minas Gerais" },
  PA: { lat: -1.46, lng: -48.50, name: "Pará" },
  PB: { lat: -7.12, lng: -34.86, name: "Paraíba" },
  PR: { lat: -25.43, lng: -49.27, name: "Paraná" },
  PE: { lat: -8.05, lng: -34.88, name: "Pernambuco" },
  PI: { lat: -5.09, lng: -42.80, name: "Piauí" },
  RJ: { lat: -22.91, lng: -43.17, name: "Rio de Janeiro" },
  RN: { lat: -5.79, lng: -35.21, name: "Rio Grande do Norte" },
  RS: { lat: -30.03, lng: -51.23, name: "Rio Grande do Sul" },
  RO: { lat: -8.76, lng: -63.90, name: "Rondônia" },
  RR: { lat: 2.82, lng: -60.67, name: "Roraima" },
  SC: { lat: -27.59, lng: -48.55, name: "Santa Catarina" },
  SP: { lat: -23.55, lng: -46.63, name: "São Paulo" },
  SE: { lat: -10.95, lng: -37.07, name: "Sergipe" },
  TO: { lat: -10.18, lng: -48.33, name: "Tocantins" },
};

export default function MapaPage() {
  const [byOrigin, setByOrigin] = useState<StateBucket[]>([]);
  const [byDest, setByDest] = useState<StateBucket[]>([]);
  const [mode, setMode] = useState<"origin" | "dest">("origin");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch("/api/stats").then((r) => r.json());
      setByOrigin(d.byOrigin || []);
      setByDest(d.byDest || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const data = mode === "origin" ? byOrigin : byDest;
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  const markers: MapMarker[] = useMemo(() => {
    return data
      .filter((d) => STATE_COORDS[d.state])
      .map((d) => {
        const coords = STATE_COORDS[d.state];
        const ratio = d.total / maxVal;
        const size = Math.max(30, Math.min(64, 30 + ratio * 34));
        const color = mode === "origin"
          ? ratio > 0.6 ? "#ea580c" : ratio > 0.3 ? "#f97316" : "#fb923c"
          : ratio > 0.6 ? "#059669" : ratio > 0.3 ? "#10b981" : "#34d399";
        return {
          lat: coords.lat,
          lng: coords.lng,
          label: String(d.total),
          color,
          size,
          popup: `<div style="font-family:system-ui;padding:4px">
            <strong style="font-size:14px">${coords.name} (${d.state})</strong><br/>
            <span style="color:#64748b;font-size:12px">${d.total} ${d.total === 1 ? "frete" : "fretes"} ${mode === "origin" ? "saindo" : "chegando"}</span><br/>
            <a href="/fretes?${mode === "origin" ? "originState" : "destState"}=${d.state}" style="color:#f97316;font-weight:700;font-size:12px;text-decoration:none">Ver fretes →</a>
          </div>`,
        };
      });
  }, [data, maxVal, mode]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
            <IcMap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Mapa de Fretes ao Vivo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mapa interativo real com a distribuição geográfica das cargas no Brasil.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
          <IcRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {/* Toggle */}
      <div className="mt-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setMode("origin")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${mode === "origin" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}
        >
          Origens (cargas saindo)
        </button>
        <button
          onClick={() => setMode("dest")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${mode === "dest" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}
        >
          Destinos (cargas chegando)
        </button>
      </div>

      {/* Mapa real */}
      <div className="mt-5">
        <LiveMap markers={markers} height={520} fitBounds={markers.length > 0} zoom={4} />
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-4 h-4 rounded-full ${mode === "origin" ? "bg-orange-600" : "bg-emerald-600"}`} /> Alto volume
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded-full ${mode === "origin" ? "bg-orange-400" : "bg-emerald-400"}`} /> Baixo volume
        </span>
        <span className="text-slate-400">Clique em um marcador para ver os fretes daquele estado</span>
      </div>

      {/* Ranking */}
      <h2 className="mt-10 text-lg font-bold text-slate-900 dark:text-white">
        Top estados {mode === "origin" ? "de origem" : "de destino"}
      </h2>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.slice(0, 8).map((s, i) => (
          <Link
            key={s.state}
            href={`/fretes?${mode === "origin" ? "originState" : "destState"}=${s.state}`}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-orange-400 transition-colors text-center"
          >
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">#{i + 1}</p>
            <p className="text-lg font-bold text-orange-500 mt-1">{s.state}</p>
            <p className="text-xs text-slate-500">{STATE_COORDS[s.state]?.name}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{s.total} fretes</p>
          </Link>
        ))}
      </div>

      {data.length === 0 && !loading && (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
          <IcSearch className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="mt-3 font-bold text-slate-900 dark:text-white">Nenhum frete ativo no momento</p>
          <Link href="/publicar" className="mt-3 inline-block text-orange-600 font-semibold text-sm hover:underline">Publicar o primeiro frete →</Link>
        </div>
      )}
    </div>
  );
}
