"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";
import { UFS, VEHICLE_TYPES, CARGO_TYPES } from "@/lib/constants";

type AIResponse = {
  suggestedPrice: number; floorPrice: number; ceilingPrice: number;
  avgMarketPrice: number; perKm: string; confidence: string;
  sampleSize: number; minMarket: number; maxMarket: number;
  factors: { label: string; impact: string; icon: string }[];
  recommendation: string;
};

export default function IAPricingPage() {
  const [form, setForm] = useState({
    originState: "", destState: "", cargoType: "",
    distanceKm: "", weightKg: "", vehicleType: "",
  });
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  function set(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })); }

  const analyze = useCallback(async () => {
    if (!form.originState || !form.destState) return;
    setLoading(true); setAnalyzing(true);

    // Simulate AI "thinking" animation
    await new Promise(r => setTimeout(r, 1500));
    setAnalyzing(false);

    const params = new URLSearchParams();
    if (form.originState) params.set("originState", form.originState);
    if (form.destState) params.set("destState", form.destState);
    if (form.cargoType) params.set("cargoType", form.cargoType);
    if (form.distanceKm) params.set("distanceKm", form.distanceKm);
    if (form.weightKg) params.set("weightKg", form.weightKg);
    if (form.vehicleType) params.set("vehicleType", form.vehicleType);

    try {
      const res = await fetch(`/api/ai-price?${params}`);
      const data = await res.json();
      setResult(data);
    } catch { setResult(null); }

    setLoading(false);
  }, [form]);

  const confidenceColor = result?.confidence === "alta" ? "text-emerald-500" : result?.confidence === "media" ? "text-amber-500" : "text-orange-500";
  const confidenceEmoji = result?.confidence === "alta" ? "🟢" : result?.confidence === "media" ? "🟡" : "🟠";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🤖 IA de Precificação Inteligente</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Nossa IA analisa centenas de fretes no mercado e sugere o melhor preço para o seu frete, baseado em dados reais.
      </p>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Dados do frete</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Origem UF *</label>
            <select value={form.originState} onChange={e => set("originState", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white">
              <option value="">Selecione</option>
              {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Destino UF *</label>
            <select value={form.destState} onChange={e => set("destState", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white">
              <option value="">Selecione</option>
              {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Tipo de carga</label>
            <select value={form.cargoType} onChange={e => set("cargoType", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white">
              <option value="">Qualquer</option>
              {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Distancia (km)</label>
            <input type="number" min="1" value={form.distanceKm} onChange={e => set("distanceKm", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm" placeholder="Opcional" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Peso (kg)</label>
            <input type="number" min="1" value={form.weightKg} onChange={e => set("weightKg", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm" placeholder="Opcional" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Caminhao</label>
            <select value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white">
              <option value="">Qualquer</option>
              {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <button onClick={analyze} disabled={loading || !form.originState || !form.destState}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-lg">
          {analyzing ? "🧠 Analisando mercado..." : "🤖 Analisar preco ideal"}
        </button>
      </div>

      {analyzing && (
        <div className="mt-8 text-center">
          <div className="text-6xl animate-bounce">🧠</div>
          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">A IA esta analisando centenas de fretes similares...</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
          </div>
        </div>
      )}

      {result && !analyzing && (
        <div className="mt-8 space-y-6">
          {/* Main suggestion */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
            <p className="text-sm uppercase tracking-widest opacity-80">Preco sugerido pela IA</p>
            <p className="text-5xl md:text-6xl font-extrabold mt-2">{formatBRL(result.suggestedPrice)}</p>
            <p className="mt-2 text-lg">{result.perKm}/km</p>
            <p className="mt-3 text-sm opacity-80">
              Confianca: <span className={`font-bold ${confidenceColor}`}>{confidenceEmoji} {result.confidence}</span>
              · Amostra: {result.sampleSize} fretes do mercado
            </p>
          </div>

          {/* Price range */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">Faixa de preco recomendada</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-500 font-semibold uppercase">Minimo</p>
                <p className="text-xl font-extrabold text-red-600 dark:text-red-400 mt-1">{formatBRL(result.floorPrice)}</p>
              </div>
              <span className="text-slate-400">←</span>
              <div className="flex-1 text-center p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-500 font-semibold uppercase">Sugerido</p>
                <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">{formatBRL(result.suggestedPrice)}</p>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex-1 text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-500 font-semibold uppercase">Maximo</p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{formatBRL(result.ceilingPrice)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 text-center">
              Media de mercado: {formatBRL(result.avgMarketPrice)} · Menor: {formatBRL(result.minMarket)} · Maior: {formatBRL(result.maxMarket)}
            </p>
          </div>

          {/* Factors */}
          {result.factors.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="font-bold text-slate-900 dark:text-white mb-4">Fatores que influenciaram</h2>
              <div className="space-y-2">
                {result.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{f.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{f.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 text-white">
            <p className="font-bold">💡 Recomendacao da IA</p>
            <p className="mt-2 text-slate-300">{result.recommendation}</p>
          </div>
        </div>
      )}

      {!result && !analyzing && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📊", title: "Dados do mercado", desc: "Analisa fretes ativos e historicos" },
            { icon: "🗺️", title: "Distancia e rota", desc: "Custo por km por regiao" },
            { icon: "🌾", title: "Sazonalidade", desc: "Safra, feriacos, demanda" },
            { icon: "⚖️", title: "Peso e carga", desc: "Tipo de carga e peso" },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-center">
              <span className="text-3xl">{f.icon}</span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-2">{f.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
