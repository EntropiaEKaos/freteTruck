"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TrackingData = {
  position: { lat: number; lng: number };
  progress: number;
  origin: { state: string; coords: [number, number] };
  destination: { state: string; coords: [number, number] };
  estimatedETA: string;
  lastUpdated: string;
  speedKmh: number;
};

export default function RastrearPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch(`/api/tracking/${id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 10000); // update every 10s
    return () => clearInterval(iv);
  }, [id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando rastreamento...</div>;
  if (!data) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-5xl">📍</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Frete não encontrado para rastreamento</h1>
      <Link href="/fretes" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Buscar fretes</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/fretes/${id}`} className="text-sm text-orange-600 font-semibold hover:underline">← Voltar ao frete</Link>

      <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">📍 Rastreamento em tempo real</h1>

      {/* Map visualization (simplified SVG) */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <svg viewBox="-82 -38 50 70" className="w-full" style={{ minHeight: 350 }}>
          {/* Brazil outline simplified */}
          <path d="M -65,-5 L -55,-8 L -48,-12 L -40,-8 L -35,-15 L -30,-20 L -25,-18 L -20,-22 L -15,-18 L -10,-20 L -5,-16 L -2,-10 L -5,-3 L -8,5 L -15,12 L -25,18 L -35,22 L -45,18 L -52,14 L -58,8 L -62,2 Z"
            fill="#f0fdf4" stroke="#166534" strokeWidth={0.5} />

          {/* Route line */}
          <line
            x1={data.origin.coords[1]} y1={data.origin.coords[0]}
            x2={data.destination.coords[1]} y2={data.destination.coords[0]}
            stroke="#ea580c" strokeWidth={0.6} strokeDasharray={2}
          />

          {/* Origin point */}
          <circle cx={data.origin.coords[1]} cy={data.origin.coords[0]} r={1.2} fill="#3b82f6" />
          <text x={data.origin.coords[1] + 1.5} y={data.origin.coords[0]} fontSize={2.5} fill="#1e40af" fontWeight="bold">
            🚩 {data.origin.state}
          </text>

          {/* Destination point */}
          <circle cx={data.destination.coords[1]} cy={data.destination.coords[0]} r={1.2} fill="#ef4444" />
          <text x={data.destination.coords[1] + 1.5} y={data.destination.coords[0]} fontSize={2.5} fill="#dc2626" fontWeight="bold">
            🏁 {data.destination.state}
          </text>

          {/* Current position (truck) */}
          <circle cx={data.position.lng} cy={data.position.lat} r={1.5} fill="#ea580c" />
          <g transform={`translate(${data.position.lng},${data.position.lat})`}>
            <rect x={-1.5} y={-2} width={3} height={4} rx={0.5} fill="#ea580c" />
          </g>
        </svg>

        {/* Progress bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur p-4 flex items-center gap-4 text-sm">
          <span className="font-bold text-orange-400 shrink-0">{data.progress}%</span>
          <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-orange-400 transition-all duration-1000" style={{ width: `${data.progress}%` }} />
          </div>
          <span className="shrink-0 text-white">{data.estimatedETA}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["📏 Progresso", `${data.progress}%`],
          ["🛣️ Rota", `${data.origin.state} → ${data.destination.state}`],
          ["⚡ Velocidade", `~${data.speedKmh} km/h`],
          ["🕐 Última atualização", new Date(data.lastUpdated).toLocaleTimeString("pt-BR")],
        ].map(([label, value]) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
        ⚠️ Este é um rastreamento simulado para demonstração. Em produção seria integrado com APIs de GPS (Google Maps, OpenStreetMap, etc).
      </p>
    </div>
  );
}
