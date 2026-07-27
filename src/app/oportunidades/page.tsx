"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FreightCard from "@/components/FreightCard";
import { IcBrain, IcRefresh, IcTruck, IcShield } from "@/components/Icons";
import type { Freight } from "@/db/schema";
import type { OpportunityScore } from "@/lib/freight-score";

type OpportunityRow = {
  freight: Freight;
  ownerName: string;
  ownerCompany: string | null;
  ownerVerified: boolean;
  opportunity: OpportunityScore;
};

type MatchResponse = {
  profile: { state: string | null; vehicleType: string | null; bodyType: string | null };
  opportunities: OpportunityRow[];
  generatedAt: string;
};

export default function OpportunitiesPage() {
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);
  const [minScore, setMinScore] = useState(0);

  async function load(score = minScore) {
    setLoading(true);
    const res = await fetch(`/api/matches?minScore=${score}&limit=50`);
    if (res.status === 401) {
      setGuest(true);
      setLoading(false);
      return;
    }
    const body = await res.json();
    setData(body);
    setLoading(false);
  }

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (guest) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <IcBrain className="w-14 h-14 text-orange-500 mx-auto" />
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Smart Match personalizado</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Faça login para receber cargas ranqueadas para o seu caminhão, estado e carroceria.</p>
        <Link href="/entrar" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3 rounded-xl">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
            <IcBrain className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Smart Match de Cargas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">As melhores oportunidades para o seu perfil, ordenadas por inteligência de negócio.</p>
          </div>
        </div>
        <button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
          <IcRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar ranking
        </button>
      </div>

      {data && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <p className="text-xs uppercase tracking-wider font-bold text-orange-400">Perfil usado no ranking</p>
            <div className="mt-3 flex gap-3 flex-wrap text-sm">
              <span className="bg-white/10 px-3 py-1.5 rounded-lg">UF: <b>{data.profile.state || "não informada"}</b></span>
              <span className="bg-white/10 px-3 py-1.5 rounded-lg">Veículo: <b>{data.profile.vehicleType || "não informado"}</b></span>
              <span className="bg-white/10 px-3 py-1.5 rounded-lg">Carroceria: <b>{data.profile.bodyType || "não informada"}</b></span>
              <Link href="/configuracoes" className="text-orange-300 hover:underline self-center font-semibold">Melhorar meu perfil →</Link>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 min-w-[220px]">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-400">Score mínimo</label>
            <select value={minScore} onChange={(e) => { const value = Number(e.target.value); setMinScore(value); load(value); }} className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm">
              <option value={0}>Todas</option>
              <option value={50}>50+ Regular</option>
              <option value={68}>68+ Boas</option>
              <option value={82}>82+ Excelentes</option>
            </select>
          </div>
        </div>
      )}

      <div className="mt-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs text-blue-800 dark:text-blue-300">
        <b>Como calculamos:</b> remuneração por km, piso mínimo ANTT, embarcador verificado, pedágio, origem, caminhão e carroceria compatíveis. O score é uma recomendação; valide os custos reais antes de fechar.
      </div>

      {loading ? (
        <div className="mt-10 text-center text-slate-500 animate-pulse">Analisando oportunidades...</div>
      ) : !data?.opportunities?.length ? (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <IcTruck className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="mt-3 font-bold text-slate-900 dark:text-white">Nenhuma oportunidade nessa faixa</h2>
          <p className="mt-1 text-sm text-slate-500">Reduza o score mínimo ou complete seu perfil.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.opportunities.map((row) => (
            <FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} ownerVerified={row.ownerVerified} opportunity={row.opportunity} />
          ))}
        </div>
      )}

      <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex items-start gap-3">
        <IcShield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div><p className="font-bold text-sm text-slate-900 dark:text-white">Decisão assistida, não automática</p><p className="text-xs text-slate-500 mt-1">O FreteTruck não garante lucratividade nem substitui análise de documentação, seguro, riscos e negociação comercial.</p></div>
      </div>
    </div>
  );
}
