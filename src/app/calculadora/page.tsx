"use client";

import { useMemo, useState } from "react";

function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CalculatorPage() {
  const [distance, setDistance] = useState("1000");
  const [freightValue, setFreightValue] = useState("8000");
  const [dieselPrice, setDieselPrice] = useState("6.20");
  const [consumption, setConsumption] = useState("2.2");
  const [tolls, setTolls] = useState("400");
  const [maintenance, setMaintenance] = useState("0.45");
  const [food, setFood] = useState("250");
  const [otherCosts, setOtherCosts] = useState("0");
  const [returnEmpty, setReturnEmpty] = useState(false);

  const result = useMemo(() => {
    const km = parseFloat(distance) || 0;
    const value = parseFloat(freightValue) || 0;
    const diesel = parseFloat(dieselPrice) || 0;
    const kmPerL = parseFloat(consumption) || 1;
    const toll = parseFloat(tolls) || 0;
    const maint = parseFloat(maintenance) || 0;
    const foodCost = parseFloat(food) || 0;
    const other = parseFloat(otherCosts) || 0;

    const totalKm = returnEmpty ? km * 2 : km;
    const fuelCost = (totalKm / kmPerL) * diesel;
    const maintCost = totalKm * maint;
    const totalCost = fuelCost + toll + maintCost + foodCost + other;
    const profit = value - totalCost;
    const profitPerKm = km > 0 ? profit / km : 0;
    const valuePerKm = km > 0 ? value / km : 0;
    const margin = value > 0 ? (profit / value) * 100 : 0;

    return { totalKm, fuelCost, maintCost, totalCost, profit, profitPerKm, valuePerKm, margin, toll, foodCost, other };
  }, [distance, freightValue, dieselPrice, consumption, tolls, maintenance, food, otherCosts, returnEmpty]);

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm";
  const labelCls = "text-sm font-semibold text-slate-700";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">🧮 Calculadora de frete</h1>
      <p className="mt-1 text-slate-500">
        Descubra se o frete vale a pena antes de fechar. Calcule combustível, pedágio, manutenção e seu lucro real.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Dados da viagem</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Distância (km)</label>
              <input type="number" min="1" value={distance} onChange={(e) => setDistance(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valor do frete (R$)</label>
              <input type="number" min="0" value={freightValue} onChange={(e) => setFreightValue(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Diesel (R$/litro)</label>
              <input type="number" min="0" step="0.01" value={dieselPrice} onChange={(e) => setDieselPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Consumo (km/litro)</label>
              <input type="number" min="0.5" step="0.1" value={consumption} onChange={(e) => setConsumption(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pedágios (R$)</label>
              <input type="number" min="0" value={tolls} onChange={(e) => setTolls(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Manutenção (R$/km)</label>
              <input type="number" min="0" step="0.01" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Alimentação/diárias (R$)</label>
              <input type="number" min="0" value={food} onChange={(e) => setFood(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Outros custos (R$)</label>
              <input type="number" min="0" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
            <input type="checkbox" checked={returnEmpty} onChange={(e) => setReturnEmpty(e.target.checked)} className="w-4 h-4 accent-orange-500" />
            Considerar retorno vazio (dobra km de combustível e manutenção)
          </label>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div
            className={`rounded-2xl p-6 text-white ${
              result.profit >= 0 ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            <p className="text-sm uppercase tracking-widest opacity-80 font-semibold">Lucro estimado</p>
            <p className="text-4xl font-extrabold mt-1">{brl(result.profit)}</p>
            <p className="mt-1 text-sm opacity-90">
              Margem de {result.margin.toFixed(1)}% · {brl(result.profitPerKm)}/km rodado
            </p>
            {result.profit < 0 && <p className="mt-2 text-sm font-bold">⚠️ Este frete dá prejuízo! Negocie um valor melhor.</p>}
            {result.profit >= 0 && result.margin < 20 && (
              <p className="mt-2 text-sm font-bold">⚠️ Margem apertada — avalie custos extras da rota.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-3">Detalhamento de custos</h2>
            {[
              ["⛽ Combustível", result.fuelCost],
              ["🛣️ Pedágios", result.toll],
              ["🔧 Manutenção/desgaste", result.maintCost],
              ["🍛 Alimentação/diárias", result.foodCost],
              ["📋 Outros", result.other],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-600">{label as string}</span>
                <span className="font-semibold text-slate-900">{brl(val as number)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 text-base font-extrabold">
              <span className="text-slate-900">Custo total</span>
              <span className="text-red-600">{brl(result.totalCost)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Valor por km do frete</span>
              <span className="font-semibold">{brl(result.valuePerKm)}/km</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 mt-1">
              <span>Km total considerado</span>
              <span className="font-semibold">{result.totalKm.toLocaleString("pt-BR")} km</span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-sm text-orange-800">
            💡 <b>Dica:</b> como referência, muitos caminhoneiros consideram bom um frete acima de <b>R$ 6,00/km</b> para
            carreta em rotas longas. Use a busca do FreteTruck para comparar valores na mesma rota.
          </div>
        </div>
      </div>
    </div>
  );
}
