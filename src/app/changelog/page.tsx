"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IcTrophy, IcCheck, IcShield, IcTruck, IcStar, IcRefresh, IcBrain } from "@/components/Icons";

type Feature = {
  feature: { id: number; title: string; description: string; category: string; status: string; votesCount: number };
  voted: boolean;
};

const CATEGORIES: Record<string, string> = {
  fiscal: "📑 Fiscal",
  social: "💬 Social",
  gps: "📍 GPS & Mapas",
  motorista: "🚚 Motorista",
  embarcador: "🏭 Embarcador",
};

const STATUS_LABELS: Record<string, string> = {
  planejado: "📋 Planejado",
  em_desenvolvimento: "⚡ Em Desenvolvimento",
  pronto: "✅ Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  planejado: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  em_desenvolvimento: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
  pronto: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function ChangelogPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [me, setMe] = useState<{ id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    try {
      const [featRes, meRes] = await Promise.all([
        fetch("/api/roadmap").then((r) => r.json()),
        fetch("/api/auth/me").then((r) => r.json()),
      ]);
      setFeatures(featRes.features || []);
      setMe(meRes.user);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function vote(featureId: number, currentVoted: boolean) {
    if (!me) {
      alert("Faça login para votar e sugerir melhorias!");
      return;
    }
    setBusy(featureId);
    // Optimistic update
    setFeatures((prev) =>
      prev.map((f) =>
        f.feature.id === featureId
          ? {
              ...f,
              voted: !currentVoted,
              feature: { ...f.feature, votesCount: f.feature.votesCount + (currentVoted ? -1 : 1) },
            }
          : f
      )
    );

    try {
      await fetch("/api/roadmap/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureId }),
      });
    } catch {}
    setBusy(null);
  }

  const versions = [
    {
      v: "v1.6.0",
      date: "Julho 2026",
      title: "Interatividade & Gestão Fiscal Avançada",
      badge: "Lançamento",
      items: [
        "💬 Comentários Sociais Dinâmicos na comunidade: comente, responda em threads aninhadas e curta comentários de outros caminhoneiros.",
        "📑 Gestão de Eventos de MDF-e: fluxo interativo para encerramento e emissão de carta de correção eletrônica (CC-e) simulada.",
        "🧠 Smart Match de Cargas: algoritmo inteligente com Score de Oportunidade (0-100) calibrado por eixos, piso ANTT e reputação.",
      ],
    },
    {
      v: "v1.5.0",
      date: "Julho 2026",
      title: "Controle do Banco de Dados & Moderação",
      badge: "Segurança",
      items: [
        "🗄️ Painel de Gestão do Banco (/admin/banco) para inspecionar, criar tabelas e popular dados demo diretamente pela interface.",
        "🎁 Cupons de Bônus de Trucks: resgate de códigos promocionais como BETA50 e FRETETRUCK2025 diretamente na carteira.",
        "🚨 Moderação de Postagens: botão de denúncias integrado para reportar conteúdos indesejados.",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🚀 Changelog & Roadmap Interativo</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Vote nas próximas funcionalidades e acompanhe o desenvolvimento da plataforma.</p>
        </div>
        <Link href="/fretes" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md">
          Buscar Fretes
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-start">
        {/* Histórico de Versões */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Histórico de Lançamentos</h2>
          {versions.map((ver) => (
            <div key={ver.v} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-orange-500">{ver.v}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full">{ver.badge}</span>
                </div>
                <span className="text-xs text-slate-400">{ver.date}</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-4">{ver.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {ver.items.map((it, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-orange-500">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quadro de Votação (Roadmap) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 lg:sticky lg:top-20">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <IcBrain className="w-5 h-5 text-orange-500" /> Próximas Novidades
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Escolha o que você quer ver lançado primeiro no FreteTruck!</p>

          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Carregando roadmap…</p>
          ) : (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {features.map(({ feature: f, voted }) => (
                <div key={f.id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-slate-400">{CATEGORIES[f.category] || f.category}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[f.status] || "bg-slate-100"}`}>
                      {STATUS_LABELS[f.status] || f.status}
                    </span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white mt-1.5">{f.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{f.description}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-500">{f.votesCount} votos</span>
                    <button
                      onClick={() => vote(f.id, voted)}
                      disabled={busy === f.id}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        voted
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-orange-500 hover:text-orange-500"
                      }`}
                    >
                      {voted ? "✓ Votado" : "👍 Votar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!me && !loading && (
            <p className="text-[10px] text-slate-400 mt-4 text-center">
              <Link href="/entrar" className="text-orange-500 font-semibold hover:underline">Faça login</Link> para registrar seu voto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
