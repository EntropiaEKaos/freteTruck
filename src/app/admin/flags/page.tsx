"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FeatureFlag } from "@/db/schema";

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/feature-flags");
    if (res.ok) setFlags((await res.json()).flags || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggle(flag: FeatureFlag) {
    await fetch("/api/admin/feature-flags", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: flag.id, enabled: !flag.enabled }) });
    await load();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Feature Flags</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Ative e desative recursos em produção sem novo deploy.</p>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {loading ? <p className="p-6 text-slate-500">Carregando...</p> : flags.map((f) => (
          <div key={f.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]"><p className="font-bold text-slate-900 dark:text-white">{f.label}</p><p className="text-xs text-slate-500 mt-1">{f.description}</p><p className="text-[10px] font-mono text-slate-400 mt-1">{f.key} · audience: {f.audience}</p></div>
            <button onClick={() => toggle(f)} className={`text-xs font-bold px-4 py-2 rounded-lg ${f.enabled ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>{f.enabled ? "Ativo" : "Inativo"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
