"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4", "#84cc16"];

type Data = {
  freightByDay: { day: string; total: number; active: number; closed: number }[];
  topRoutes: { route: string; freq: number; avg_price: number; total_revenue: number }[];
  proposalStats: { pending: number; accepted: number; rejected: number; total: number } | null;
  viewsByDay: { day: string; total_views: string }[];
  reviewStats: { rating: number; punctuality: number; communication: number; payment_speed: number; total_reviews: number } | null;
  notifByType: { type: string; total: number }[];
  totalFreights: number;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { setGuest(true); setLoading(false); return; }
      fetch("/api/analytics").then(r => r.json()).then(setData).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-24 text-center text-slate-500">Carregando analiticas...</div>;
  if (guest) return <div className="max-w-md mx-auto px-4 py-24 text-center"><p className="text-5xl">🔒</p><p className="mt-4 font-bold">Faça login para ver suas metricas.</p></div>;
  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">📊 Analytics Dashboard</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Suas metricas de desempenho e negocios no FreteTruck.</p>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fretes totais", value: data.totalFreights, icon: "📦", color: "from-orange-500 to-amber-500" },
          { label: "Propostas", value: data.proposalStats?.total || 0, icon: "📨", color: "from-blue-500 to-cyan-500" },
          { label: "Aceitas", value: data.proposalStats?.accepted || 0, icon: "✅", color: "from-emerald-500 to-green-500" },
          { label: "Taxa de aceite", value: data.proposalStats?.total ? `${Math.round((data.proposalStats!.accepted / data.proposalStats!.total) * 100)}%` : "0%", icon: "📈", color: "from-purple-500 to-violet-500" },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white`}>
            <p className="text-2xl">{s.icon}</p>
            <p className="text-3xl font-extrabold mt-2">{s.value}</p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Freights over time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Fretes publicados (7 dias)</h2>
          {data.freightByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.freightByDay.map(d => ({ ...d, day: new Date(d.day).toLocaleDateString("pt-BR", { weekday: "short" }) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="active" fill="#10b981" name="Ativos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" fill="#f97316" name="Fechados" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">Nenhum frete ainda.</p>}
        </div>

        {/* Views */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Visualizacoes</h2>
          {data.viewsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.viewsByDay.map(d => ({ ...d, day: new Date(d.day).toLocaleDateString("pt-BR", { weekday: "short" }) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total_views" stroke="#f97316" strokeWidth={3} dot={{ fill: "#f97316" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">Sem dados ainda.</p>}
        </div>

        {/* Top routes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Top rotas por receita</h2>
          {data.topRoutes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topRoutes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="route" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="avg_price" fill="#f97316" name="Preco medio" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">Nenhuma rota com dados.</p>}
        </div>

        {/* Notifications by type */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Notificacoes por tipo</h2>
          {data.notifByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.notifByType.map((n, i) => ({ name: n.type.replace(/_/g, " "), value: n.total }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.notifByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">Nenhuma notificacao.</p>}
        </div>
      </div>

      {/* Review stats (for embarcadores) */}
      {data.reviewStats && data.reviewStats.total_reviews > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Suas avaliacoes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Media geral", value: data.reviewStats.rating.toFixed(1) },
              { label: "Pontualidade", value: data.reviewStats.punctuality ? data.reviewStats.punctuality.toFixed(1) : "-" },
              { label: "Comunicacao", value: data.reviewStats.communication ? data.reviewStats.communication.toFixed(1) : "-" },
              { label: "Pagamento", value: data.reviewStats.payment_speed ? data.reviewStats.payment_speed.toFixed(1) : "-" },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-extrabold text-orange-500">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">{data.reviewStats.total_reviews} avaliacoes recebidas</p>
        </div>
      )}
    </div>
  );
}
