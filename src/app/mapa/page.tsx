"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StateBucket = { state: string; total: number };

const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
  AC: { x: 8, y: 42 }, AM: { x: 18, y: 25 }, RR: { x: 20, y: 7 }, PA: { x: 38, y: 28 },
  AP: { x: 42, y: 10 }, TO: { x: 45, y: 48 }, MA: { x: 52, y: 30 }, PI: { x: 57, y: 35 },
  CE: { x: 65, y: 28 }, RN: { x: 72, y: 28 }, PB: { x: 72, y: 32 }, PE: { x: 70, y: 36 },
  AL: { x: 72, y: 40 }, SE: { x: 70, y: 43 }, BA: { x: 60, y: 50 }, MG: { x: 58, y: 62 },
  ES: { x: 67, y: 62 }, RJ: { x: 63, y: 70 }, SP: { x: 52, y: 72 }, PR: { x: 48, y: 78 },
  SC: { x: 50, y: 84 }, RS: { x: 45, y: 90 }, MS: { x: 38, y: 70 }, MT: { x: 30, y: 50 },
  GO: { x: 45, y: 58 }, DF: { x: 50, y: 57 }, RO: { x: 15, y: 48 },
};

export default function MapaPage() {
  const [byOrigin, setByOrigin] = useState<StateBucket[]>([]);
  const [byDest, setByDest] = useState<StateBucket[]>([]);
  const [mode, setMode] = useState<"origin" | "dest">("origin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setByOrigin(d.byOrigin || []);
        setByDest(d.byDest || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const data = mode === "origin" ? byOrigin : byDest;
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const dataMap = Object.fromEntries(data.map((d) => [d.state, d.total]));

  function getRadius(state: string): number {
    const val = dataMap[state] || 0;
    return Math.max(8, Math.min(28, 8 + (val / maxVal) * 20));
  }

  function getColor(state: string): string {
    const val = dataMap[state] || 0;
    if (val === 0) return mode === "origin" ? "#e2e8f0" : "#e2e8f0";
    const ratio = val / maxVal;
    if (mode === "origin") {
      if (ratio > 0.6) return "#ea580c";
      if (ratio > 0.3) return "#f97316";
      return "#fdba74";
    }
    if (ratio > 0.6) return "#059669";
    if (ratio > 0.3) return "#10b981";
    return "#6ee7b7";
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando mapa...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🗺️ Mapa de fretes</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Visualize a distribuição de cargas por estado.</p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode("origin")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === "origin" ? "bg-orange-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
          }`}
        >
          📦 Origens (saindo de)
        </button>
        <button
          onClick={() => setMode("dest")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            mode === "dest" ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
          }`}
        >
          📍 Destinos (chegando em)
        </button>
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full max-w-2xl mx-auto" style={{ minHeight: 400 }}>
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="transparent" />

          {Object.entries(STATE_POSITIONS).map(([uf, pos]) => {
            const val = dataMap[uf] || 0;
            const r = getRadius(uf);
            const color = getColor(uf);
            return (
              <Link key={uf} href={`/fretes?${mode === "origin" ? "originState" : "destState"}=${uf}`}>
                <g className="cursor-pointer hover:opacity-80 transition-opacity">
                  <circle cx={pos.x} cy={pos.y} r={r / 4} fill={color} opacity={0.3} />
                  <circle cx={pos.x} cy={pos.y} r={r / 6} fill={color} />
                  <text x={pos.x} y={pos.y - r / 4 - 1.5} textAnchor="middle" fontSize="3" fontWeight="bold" fill="currentColor" className="text-slate-900 dark:text-white">
                    {uf}
                  </text>
                  {val > 0 && (
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" fontSize="2.5" fontWeight="bold" fill="white">
                      {val}
                    </text>
                  )}
                </g>
              </Link>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-full ${mode === "origin" ? "bg-orange-500" : "bg-emerald-500"}`} />
            Muitos fretes
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-full ${mode === "origin" ? "bg-orange-300" : "bg-emerald-300"}`} />
            Poucos fretes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600" />
            Sem fretes
          </span>
        </div>
      </div>

      {/* Ranking */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.slice(0, 8).map((s, i) => (
          <Link
            key={s.state}
            href={`/fretes?${mode === "origin" ? "originState" : "destState"}=${s.state}`}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-orange-400 transition-colors text-center"
          >
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">#{i + 1}</p>
            <p className="text-lg font-bold mt-1">{s.state}</p>
            <p className="text-sm text-slate-500">{s.total} fretes</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
