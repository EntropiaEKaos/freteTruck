"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatBRL, formatWeight, timeAgo } from "@/lib/constants";
import type { Freight } from "@/db/schema";

type Badge = { icon: string; label: string; color: string };
type ReviewRow = { review: { id: number; rating: number; comment: string | null; createdAt: string }; authorName: string };
type ProfileData = {
  user: { id: number; name: string; role: string; company: string | null; city: string | null; state: string | null; vehicleType: string | null; bodyType: string | null; createdAt: string };
  stats: { activeFreights: number; closedFreights: number; avgRating: number; totalReviews: number; totalProposals: number };
  badges: Badge[];
  level: string;
  levelColor: string;
  recentFreights: Freight[];
  recentReviews: ReviewRow[];
} | null;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>★</span>
      ))}
    </span>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ProfileData>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [profRes, meRes] = await Promise.all([
        fetch(`/api/profile/${params.id}`).then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      if (profRes.error) { setLoading(false); return; }
      setData(profRes);
      setMe(meRes.user);
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando perfil...</div>;
  if (!data) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-5xl">😕</p>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Perfil não encontrado</h1>
      <Link href="/fretes" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Voltar aos fretes</Link>
    </div>
  );

  const { user: u, stats, badges, level, levelColor, recentFreights, recentReviews } = data;
  const badgeColors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    purple: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    orange: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    slate: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    cyan: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
  };

  const memberDays = Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-3xl font-extrabold shrink-0">
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold">{u.name}</h1>
              <p className="text-slate-300 text-sm mt-1">
                {u.role === "motorista" ? "🚛 Motorista" : "🏭 Embarcador"}
                {u.company ? ` · ${u.company}` : ""}
                {u.city && u.state ? ` · ${u.city}/${u.state}` : ""}
              </p>
              {u.vehicleType && (
                <p className="text-slate-300 text-sm mt-0.5">Caminhão: {u.vehicleType}{u.bodyType ? ` · ${u.bodyType}` : ""}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">Membro há {memberDays} dias</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border ${badgeColors[levelColor] || badgeColors.slate}`}>
                🏆 {level}
              </span>
              {stats.totalReviews > 0 && (
                <div className="mt-2 flex items-center gap-1 justify-end">
                  <Stars value={Math.round(stats.avgRating)} />
                  <span className="text-sm font-bold">{stats.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({stats.totalReviews})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${badgeColors[b.color] || badgeColors.slate}`}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-700">
          {[
            { label: "Fretes ativos", value: stats.activeFreights },
            { label: "Fretes fechados", value: stats.closedFreights },
            { label: "Avaliações", value: stats.totalReviews },
            { label: "Propostas", value: stats.totalProposals },
          ].map((s) => (
            <div key={s.label} className="p-5 text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {me && me.id !== u.id && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => router.push(`/chat?with=${u.id}`)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
          >
            💬 Enviar mensagem
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fretes ativos */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Fretes ativos</h2>
          {recentFreights.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">
              Nenhum frete ativo no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recentFreights.map((f) => (
                <Link key={f.id} href={`/fretes/${f.id}`} className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {f.originCity}/{f.originState} <span className="text-orange-500">→</span> {f.destCity}/{f.destState}
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {f.priceType === "combinar" || !f.price ? "A combinar" : formatBRL(f.price)}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.cargoType} · {formatWeight(f.weightKg)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">Avaliações recentes</h2>
          {recentReviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">
              Nenhuma avaliação recebida ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r) => (
                <div key={r.review.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2">
                    <Stars value={r.review.rating} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.authorName}</span>
                    <span className="text-xs text-slate-400">{timeAgo(r.review.createdAt)}</span>
                  </div>
                  {r.review.comment && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
