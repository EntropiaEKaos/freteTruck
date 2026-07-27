"use client";

import { useMemo, useState } from "react";
import { calculateANTTFloor, type CargoCategory } from "@/lib/antt";
import { formatBRL } from "@/lib/constants";
import { IcCalc, IcShield, IcTruck, IcCheck } from "@/components/Icons";

const CATEGORIES: { key: CargoCategory; label: string }[] = [
  { key: "granel_solido", label: "Granel Sólido (Soja, Milho, Fertilizantes)" },
  { key: "granel_liquido", label: "Granel Líquido (Combustíveis, Químicos)" },
  { key: "frigorificada", label: "Carga Frigorificada / Perecíveis" },
  { key: "geral", label: "Carga Geral / Industrializados" },
  { key: "conteinerizada", label: "Carga Conteinerizada" },
  { key: "perigosa", label: "Carga Perigosa (Inflamáveis, Corrosivos)" },
];

const AXLE_OPTIONS = [
  { axles: 2, label: "2 eixos (VUC / Toco)" },
  { axles: 3, label: "3 eixos (Truck)" },
  { axles: 4, label: "4 eixos (Bitruck)" },
  { axles: 5, label: "5 eixos (Carreta Simples)" },
  { axles: 6, label: "6 eixos (Carreta LS)" },
  { axles: 7, label: "7 eixos (Bitrem)" },
  { axles: 9, label: "9 eixos (Rodotrem)" },
];

export default function ANTTPage() {
  const [distanceKm, setDistanceKm] = useState("1000");
  const [axles, setAxles] = useState("6");
  const [category, setCategory] = useState<CargoCategory>("granel_solido");
  const [offeredPrice, setOfferedPrice] = useState("9500");

  const result = useMemo(() => {
    const km = parseFloat(distanceKm) || 0;
    const ax = parseInt(axles, 10) || 6;
    return calculateANTTFloor(km, ax, category);
  }, [distanceKm, axles, category]);

  const offered = parseFloat(offeredPrice) || 0;
  const isAboveFloor = offered >= result.minPrice;
  const diff = offered - result.minPrice;
  const diffPercent = result.minPrice > 0 ? (diff / result.minPrice) * 100 : 0;

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
          <IcShield className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Tabela de Piso Mínimo ANTT
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Conforme a Lei Federal nº 13.703/2018 (Política Nacional de Pisos Mínimos do Transporte Rodoviário de Cargas).
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Calculator Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <IcCalc className="w-4 h-4 text-orange-500" /> Parâmetros da Viagem
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Distância da Rota (km)</label>
            <input
              type="number"
              min="1"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Número de Eixos / Veículo</label>
            <select
              value={axles}
              onChange={(e) => setAxles(e.target.value)}
              className={inputCls}
            >
              {AXLE_OPTIONS.map((a) => (
                <option key={a.axles} value={a.axles}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Tipo de Carga (Classificação ANTT)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CargoCategory)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Valor Oferecido do Frete (R$) — Opcional</label>
            <input
              type="number"
              min="0"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              className={inputCls}
              placeholder="Ex: 9500"
            />
          </div>
        </div>

        {/* Result & Comparison Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 text-white">
            <p className="text-xs uppercase tracking-widest text-orange-400 font-semibold">Piso Mínimo Legal ANTT</p>
            <p className="text-4xl font-extrabold mt-1 text-emerald-400">{formatBRL(result.minPrice)}</p>
            <p className="text-sm text-slate-300 mt-1">
              R$ {result.perKm.toFixed(2)} por km rodado · {result.axles} eixos
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Custo Deslocamento:</span>
                <p className="font-bold text-white mt-0.5">{formatBRL(result.variableCost)}</p>
              </div>
              <div>
                <span className="text-slate-400">Custo Fixo por Eixo:</span>
                <p className="font-bold text-white mt-0.5">{formatBRL(result.fixedCost)}</p>
              </div>
            </div>
          </div>

          {/* Comparison with offered price */}
          {offered > 0 && (
            <div
              className={`rounded-2xl p-5 border ${
                isAboveFloor
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                  : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{isAboveFloor ? "✅" : "⚠️"}</span>
                <div>
                  <p className={`font-bold text-sm ${isAboveFloor ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                    {isAboveFloor ? "Frete Acima do Piso Legal ANTT" : "Atenção: Frete Abaixo do Piso ANTT"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {isAboveFloor
                      ? `O valor de ${formatBRL(offered)} está +${diffPercent.toFixed(1)}% (${formatBRL(diff)}) acima do piso legal.`
                      : `O valor de ${formatBRL(offered)} está ${diffPercent.toFixed(1)}% (${formatBRL(Math.abs(diff))}) abaixo do mínimo da lei.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <IcCheck className="w-4 h-4 text-emerald-500" /> Sobre o Piso Mínimo Obrigatório:
            </p>
            <p>• Fixado pela ANTT para garantir a cobertura dos custos operacionais do transportador autônomo.</p>
            <p>• O não cumprimento da tabela pode sujeitar o contratante a multas e sanções legais.</p>
            <p>• O FreteTruck exibe automaticamente o selo de conformidade ANTT em todas as cargas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
