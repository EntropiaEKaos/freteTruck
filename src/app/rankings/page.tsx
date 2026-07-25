"use client";

import { useEffect, useState } from "react";

type User = { id: number; name: string; company: string | null; state: string | null; city: string | null; vehicleType: string | null; };
type RankingUser = User & { totalFreights: number | null; freightCount: number | null; };

export default function RankingsPage() {
  const [data, setData] = useState<{
    topEmbarcadores: RankingUser[]; topMotoristas: RankingUser[]; topRated: RankingUser[];
  }>({ topEmbarcadores: [], topMotoristas: [], topRated: [] });
  const [tab, setTab] = useState<"embarcadores" | "motoristas" | "rated">("embarcadores");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rankings").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500">Carregando rankings...</div>;

  const trophy = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🏆 Rankings do FreteTruck</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Os usuarios mais ativos e bem avaliados da plataforma.</p>

      <div className="mt-6 flex gap-2 flex-wrap">
        {(["embarcadores", "motoristas", "rated"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? "bg-slate-900 dark:bg-orange-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
            }`}>
            {t === "embarcadores" ? "🏭 Top Embarcadores" : t === "motoristas" ? "🚛 Top Motoristas" : "⭐ Top Avaliados"}
          </button>
        ))}
      </div>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {(tab === "embarcadores" ? data.topEmbarcadores : tab === "motoristas" ? data.topMotoristas : data.topRated)
            .map((u, i) => (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <span className="text-2xl w-8 text-center">{i < 3 ? trophy[i] : `#${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {u.company || u.city || "Usuario"}{u.state ? ` · ${u.state}` : ""}
                    {u.vehicleType ? ` · ${u.vehicleType}` : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-orange-500 shrink-0">
                  {tab === "embarcadores" ? `${u.totalFreights || u.freightCount || 0} fretes` :
                   tab === "motoristas" ? `${u.freightCount || u.totalFreights || 0} fretes` : "⭐ Top rating"}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Podium */}
      {data.topEmbarcadores.length >= 3 && tab === "embarcadores" && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">🏟️ Podium de Embarcadores</h2>
          <div className="flex items-end justify-center gap-4">
            {[1, 0, 2].map(idx => {
              const u = data.topEmbarcadores[idx];
              if (!u) return null;
              const heights = [200, 240, 160];
              const colors = ["from-amber-400 to-yellow-500", "from-slate-300 to-slate-400", "from-orange-400 to-amber-600"];
              return (
                <div key={u.id} className="flex flex-col items-center">
                  <span className="text-4xl mb-2">{trophy[idx]}</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-20">{u.name.split(" ")[0]}</p>
                  <div className={`mt-2 bg-gradient-to-t ${colors[idx]} rounded-t-xl w-20 flex items-end justify-center p-2`} style={{ height: heights[idx] }}>
                    <p className="text-white font-extrabold text-lg">{u.totalFreights || 0}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
