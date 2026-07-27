"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CheckItem = { id: string; label: string; category: string; mandatory: boolean };

const CHECKLIST_ITEMS: CheckItem[] = [
  { id: "cnh", label: "CNH válida (1ª ou 2ª via) e na validade", category: "Documentos", mandatory: true },
  { id: "rntc", label: "RNTC (Carteira Nacional de Transportador) atualizado", category: "Documentos", mandatory: true },
  { id: "crvl", label: "CRVL do veículo em dia", category: "Documentos", mandatory: true },
  { id: "mop", label: "MOP (Manifesto de Operação) emitido", category: "Documentos", mandatory: true },
  { id: "crlv", label: "CRLV-Eletrônico no celular (ou impresso)", category: "Documentos", mandatory: true },

  { id: "pneus", label: "Calibragem dos pneus verificada", category: "Veículo", mandatory: true },
  { id: "freios", label: "Teste dos freios (dianteiro + traseiro + estacionamento)", category: "Veículo", mandatory: true },
  { id: "farol", label: "Faróis, setas e luzes de freio funcionando", category: "Veículo", mandatory: true },
  { id: "retrovisor", label: "Retrovisores ajustados e completos", category: "Veículo", mandatory: true },
  { id: "oleo", label: "Nível de óleo do motor verificado", category: "Veículo", mandatory: true },
  { id: "ar", label: "Nível de ar do sistema verificado", category: "Veículo", mandatory: false },
  { id: "agua", label: "Reservatório de água (rad/câmbio) cheio", category: "Veículo", mandatory: false },
  { id: "extintor", label: "Extintor de incêndio (válido, 2kg mínimo)", category: "Veículo", mandatory: true },
  { id: "triangulo", label: "Triângulo de sinalização (2 unidades)", category: "Veículo", mandatory: true },
  { id: "macaco", label: "Macaco hidráulico + chave de roda", category: "Veículo", mandatory: true },

  { id: "bordao", label: "Bordão completo e em bom estado", category: "Carga", mandatory: true },
  { id: "lona", label: "Lona em bom estado e tamanho correto", category: "Carga", mandatory: false },
  { id: "rastreador", label: "Rastreador GPS ligado e funcionando", category: "Carga", mandatory: false },
  { id: "amarracao", label: "Materiais de amarração prontos (cintas, cordas)", category: "Carga", mandatory: true },
  { id: "carga_ok", label: "Carga conferida e conferida com o embarcador", category: "Carga", mandatory: true },

  { id: "peso", label: "Peso conferido na balança antes da saída", category: "Segurança", mandatory: true },
  { id: "celular", label: "Celular carregado + carregador no caminhão", category: "Segurança", mandatory: true },
  { id: "documentos_copia", label: "Cópia dos documentos digitalizada no celular", category: "Segurança", mandatory: false },
  { id: "contato", label: "Número do embarcador e da empresa salvos", category: "Segurança", mandatory: true },
  { id: "rota", label: "Rota planejada e verificada (obras, pedágios, postos)", category: "Segurança", mandatory: true },
  { id: "saude", label: "Saúde OK — descansado e sem sinais de fadiga", category: "Segurança", mandatory: true },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Documentos": "📋", "Veículo": "🚛", "Carga": "📦", "Segurança": "🛡️",
};

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ft_checklist");
    if (saved) {
      try { setChecked(JSON.parse(saved)); } catch {}
    }
  }, []);

  function toggle(id: string) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("ft_checklist", JSON.stringify(next));
      return next;
    });
  }

  function resetAll() {
    setChecked({});
    localStorage.removeItem("ft_checklist");
  }

  const total = CHECKLIST_ITEMS.length;
  const completed = Object.values(checked).filter(Boolean).length;
  const progress = Math.round((completed / total) * 100);
  const mandatoryOk = CHECKLIST_ITEMS.filter(c => c.mandatory && checked[c.id]).length;
  const mandatoryTotal = CHECKLIST_ITEMS.filter(c => c.mandatory).length;
  const allDone = mandatoryOk === mandatoryTotal && completed === total;

  function save() {
    const data = {
      date: new Date().toISOString(),
      completed,
      total,
      percentage: progress,
      items: checked,
    };
    const history = JSON.parse(localStorage.getItem("ft_checklist_history") || "[]");
    history.unshift(data);
    if (history.length > 50) history.length = 50;
    localStorage.setItem("ft_checklist_history", JSON.stringify(history));
    setSavedAt(new Date().toLocaleTimeString("pt-BR"));
    setTimeout(() => setSavedAt(null), 3000);
  }

  const categories = Array.from(new Set(CHECKLIST_ITEMS.map(c => c.category)));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Checklist Pré-Viagem</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Complete todos os itens obrigatórios antes de sair na estrada.</p>

      {/* Progress bar */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{completed}/{total} itens concluídos</span>
          <span className={`text-sm font-bold ${progress === 100 ? "text-emerald-600" : "text-orange-500"}`}>{progress}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-orange-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {allDone
            ? "✅ Todos os itens obrigatórios marcados! Pode sair tranquilo."
            : `Faltam ${mandatoryTotal - mandatoryOk} itens obrigatórios.`}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button onClick={save}
          className="bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors">
          💾 Salvar registro
        </button>
        <button onClick={resetAll}
          className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
          Limpar tudo
        </button>
        {savedAt && (
          <span className="text-xs text-emerald-600 font-semibold self-center">
            ✅ Salvo às {savedAt}
          </span>
        )}
      </div>

      {/* Categories */}
      <div className="mt-6 space-y-6">
        {categories.map(cat => {
          const items = CHECKLIST_ITEMS.filter(c => c.category === cat);
          const catDone = items.filter(c => checked[c.id]).length;
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {CATEGORY_ICONS[cat] || "📁"} {cat}
                </h2>
                <span className="text-xs text-slate-400">{catDone}/{items.length}</span>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked[item.id] ? "bg-orange-500 border-orange-500" : "border-slate-300 dark:border-slate-600"
                    }`}>
                      {checked[item.id] && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                      )}
                    </div>
                    <span className={`text-sm ${checked[item.id] ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white"}`}>
                      {item.label}
                    </span>
                    {item.mandatory && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 px-1.5 py-0.5 rounded shrink-0 ml-auto">
                        Obrigatório
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
