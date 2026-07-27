"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";

type RouteStat = { originState: string; destState: string; avgPrice: string; avgDistance: string; totalFreights: number };
type StateBucket = { state: string; total: number };

export default function PrecosPage() {
  const [routes, setRoutes] = useState<RouteStat[]>([]);
  const [byOrigin, setByOrigin] = useState<StateBucket[]>([]);
  const [byDest, setByDest] = useState<StateBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setRoutes(d.routeStats || []);
        setByOrigin(d.byOrigin || []);
        setByDest(d.byDest || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando estatísticas...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">📊 Tabela de preços por rota</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Valores médios praticados no FreteTruck. Use para comparar antes de fechar seu frete.</p>

      {routes.length === 0 ? (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-5xl">📊</p>
          <p className="mt-4 font-bold text-slate-900 dark:text-white">Ainda não temos dados suficientes</p>
          <p className="mt-1 text-sm text-slate-500">Publique ou busque fretes para gerar estatísticas de mercado.</p>
        </div>
      ) : (
        <>
          {/* Route pricing table */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rota</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Preço médio</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Dist. média</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">R$/km</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fretes</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((r, i) => {
                    const avg = parseFloat(r.avgPrice);
                    const dist = parseFloat(r.avgDistance);
                    const perKm = dist > 0 ? avg / dist : 0;
                    const quality = perKm >= 7 ? "text-emerald-600" : perKm >= 5 ? "text-amber-600" : "text-red-500";
                    return (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {r.originState} <span className="text-orange-500">→</span> {r.destState}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-emerald-600 text-sm">{formatBRL(avg)}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-600 dark:text-slate-300">{Math.round(dist).toLocaleString("pt-BR")} km</td>
                        <td className={`px-5 py-3.5 text-right font-bold text-sm ${quality}`}>
                          R$ {perKm.toFixed(2)}/km
                          {perKm >= 7 ? " 🟢" : perKm >= 5 ? " 🟡" : " 🔴"}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-500">{r.totalFreights}</td>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/fretes?originState=${r.originState}&destState=${r.destState}`}
                            className="text-orange-600 text-xs font-semibold hover:underline"
                          >
                            Ver fretes →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">🟢 <span className="text-slate-600 dark:text-slate-300">Bom (≥ R$7/km)</span></span>
            <span className="flex items-center gap-1">🟡 <span className="text-slate-600 dark:text-slate-300">Regular (R$5–7/km)</span></span>
            <span className="flex items-center gap-1">🔴 <span className="text-slate-600 dark:text-slate-300">Baixo (&lt; R$5/km)</span></span>
          </div>

          {/* State stats */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">📦 Mais cargas saindo de</h2>
              <div className="space-y-2">
                {byOrigin.slice(0, 10).map((s, i) => {
                  const maxTotal = byOrigin[0]?.total || 1;
                  return (
                    <div key={s.state}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {i + 1}. {s.state}
                        </span>
                        <span className="text-slate-500">{s.total} fretes</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(s.total / maxTotal) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">📍 Mais cargas chegando em</h2>
              <div className="space-y-2">
                {byDest.slice(0, 10).map((s, i) => {
                  const maxTotal = byDest[0]?.total || 1;
                  return (
                    <div key={s.state}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {i + 1}. {s.state}
                        </span>
                        <span className="text-slate-500">{s.total} fretes</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.total / maxTotal) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
