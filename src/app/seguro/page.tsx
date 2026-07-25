"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";

type Quote = { id: number; freightId: number; cargoValue: string; distanceKm: number; premium: string; coverage: string; createdAt: string };

const COVERAGE_PLANS = [
  { key: "basico", name: "Basico", price: "R$ 0,15", desc: "Cobertura contra perda total. Ideal para cargas de baixo valor.", icon: "🛡️" },
  { key: "completo", name: "Completo", price: "R$ 0,35", desc: "Perda total + roubo + avarias. Recomendado para a maioria.", icon: "🛡️🛡️" },
  { key: "premium", name: "Premium", price: "R$ 0,60", desc: "Cobertura maxima: tudo do completo + atrasos + forca maior.", icon: "🛡️🛡️🛡️" },
];

export default function SeguroPage() {
  const [form, setForm] = useState({ cargoValue: "", distanceKm: "", coverage: "completo" });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [me, setMe] = useState<{ id: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d.user));
  }, []);

  async function calculate() {
    if (!form.cargoValue || !form.distanceKm) return;
    setLoading(true);
    try {
      const res = await fetch("/api/insurance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) setQuote(data.quote);
    } finally { setLoading(false); }
  }

  function preview() {
    const cargoValue = parseFloat(form.cargoValue) || 0;
    const distanceKm = parseInt(form.distanceKm, 10) || 0;
    const rates: Record<string, number> = { basico: 0.15, completo: 0.35, premium: 0.6 };
    const rate = rates[form.coverage] || 0.35;
    const factor = distanceKm > 0 ? (1 + distanceKm / 10000) : 1;
    return Math.round((cargoValue / 1000 * rate * factor) * 100) / 100;
  }

  if (!me) return <div className="max-w-md mx-auto px-4 py-24 text-center"><p className="text-5xl">🛡️</p><p className="mt-4 font-bold text-slate-900">Faça login para cotar seguros.</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🛡️ Cotação de Seguro</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Proteja sua carga. Cotação instantanea baseada em valor e distancia.</p>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Calcule seu seguro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Valor da carga (R$)</label>
            <input type="number" min="1" value={form.cargoValue} onChange={e => setForm(f => ({ ...f, cargoValue: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white" placeholder="Ex: 50000" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Distancia (km)</label>
            <input type="number" min="1" value={form.distanceKm} onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white" placeholder="Ex: 1500" />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-500 uppercase">Plano de cobertura</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COVERAGE_PLANS.map(p => (
              <button key={p.key} onClick={() => setForm(f => ({ ...f, coverage: p.key }))}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  form.coverage === p.key ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                }`}>
                <span className="text-xl">{p.icon}</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">{p.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{p.price}/R$1.000</p>
                <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button onClick={calculate} disabled={loading || !form.cargoValue || !form.distanceKm}
          className="mt-6 w-full bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
          {loading ? "Calculando..." : "🛡️ Calcular premium"}
        </button>
      </div>

      {/* Preview */}
      {form.cargoValue && form.distanceKm && (
        <div className="mt-4 text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">Estimativa imediata:</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{formatBRL(preview())}</p>
          <p className="text-xs text-slate-400">Plano {form.coverage} · {form.cargoValue} de carga · {form.distanceKm} km</p>
        </div>
      )}

      {quote && (
        <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">Premium: {formatBRL(parseFloat(quote.premium))}</p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
            Cobertura {quote.coverage} · {formatBRL(parseFloat(quote.cargoValue))} de carga · {quote.distanceKm} km
          </p>
          <p className="mt-4 text-xs text-emerald-500">Cotacao salva. Em producao, voce seria redirecionado para finalizar o seguro com parceiros.</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">ℹ️ Como funciona o seguro</p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400 list-disc pl-4">
          <li>O premium é calculado com base no valor da carga, distancia e tipo de cobertura</li>
          <li>Cobertura basica: perda total (colisao, incendio, roubo)</li>
          <li>Cobertura completa: basica + avarias + danos parciais</li>
          <li>Cobertura premium: completa + forca maior + atrasos + custos adicionais</li>
          <li>Em producao, integrado com seguradoras parceiras (Allianz, Zurich, Porto Seguro)</li>
        </ul>
      </div>
    </div>
  );
}
