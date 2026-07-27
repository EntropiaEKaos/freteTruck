"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeedbackReport } from "@/db/schema";
import { timeAgo } from "@/lib/constants";

export default function AdminFeedbackPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/feedback");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function update(id: number, patch: Record<string, string>) {
    await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    await load();
  }

  const badge = (status: string) => {
    const cls: Record<string, string> = { novo: "bg-blue-100 text-blue-700", analisando: "bg-amber-100 text-amber-700", resolvido: "bg-emerald-100 text-emerald-700", arquivado: "bg-slate-100 text-slate-500" };
    return <span className={`text-xs font-bold px-2 py-1 rounded-full ${cls[status] || cls.novo}`}>{status}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Feedbacks do Beta</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Bugs, sugestões e relatos enviados pelos usuários.</p>

      {loading ? <p className="mt-8 text-slate-500">Carregando...</p> : (
        <div className="mt-6 space-y-3">
          {reports.length === 0 ? <p className="text-slate-400">Nenhum feedback recebido ainda.</p> : reports.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {badge(r.status)}
                    <span className="text-xs font-bold text-orange-600 uppercase">{r.type}</span>
                    <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                    {r.priority === "critica" && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Crítica</span>}
                    {r.priority === "alta" && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Alta</span>}
                  </div>
                  <p className="mt-2 font-bold text-slate-900 dark:text-white">{r.name || "Usuário anônimo"} {r.email ? <span className="text-xs text-slate-400 font-normal">({r.email})</span> : null}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{r.message}</p>
                  {r.pageUrl && <p className="mt-2 text-xs text-slate-400 break-all">Página: {r.pageUrl}</p>}
                  {r.adminNote && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">Nota admin: {r.adminNote}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })} className="text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5">
                    <option value="novo">Novo</option><option value="analisando">Analisando</option><option value="resolvido">Resolvido</option><option value="arquivado">Arquivado</option>
                  </select>
                  <button onClick={() => { const note = prompt("Nota interna:", r.adminNote || ""); if (note !== null) update(r.id, { adminNote: note }); }} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white">Nota</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
