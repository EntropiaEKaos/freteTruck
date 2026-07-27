"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Health = {
  status: string;
  timestamp: string;
  database: { status: string; url: string; ssl: boolean; error: string | null };
  stats: { users: number; freights: number };
  version: string;
};

const CHECKS = {
  api: { label: "API REST", icon: "⚡" },
  database: { label: "Banco de Dados (PostgreSQL)", icon: "🗄️" },
  migrations: { label: "Schema / Migrações", icon: "🧬" },
  auth: { label: "Autenticação (Login)", icon: "🔐" },
  cdn: { label: "Arquivos Estáticos (CDN)", icon: "📦" },
  version: { label: "Versão do Sistema", icon: "📋" },
};

export default function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [cdnOk, setCdnOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealth(data);

        const imgRes = await fetch("/images/hero.jpg");
        setCdnOk(imgRes.ok);
      } catch {}
      setLoading(false);
    })();
  }, []);

  function statusBadge(ok: boolean | null) {
    if (ok === null) return <span className="text-sm text-slate-400">Verificando…</span>;
    return ok
      ? <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm">✓ Operacional</span>
      : <span className="inline-flex items-center gap-1 text-red-500 font-bold text-sm">✗ Indisponível</span>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Status do Sistema</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Monitoramento em tempo real da plataforma.
      </p>

      {loading ? (
        <div className="mt-8 text-center text-slate-500">Carregando status…</div>
      ) : (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {Object.entries(CHECKS).map(([key, { label, icon }]) => (
            <div key={key} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{label}</p>
                  {key === "database" && health && (
                    <p className="text-xs text-slate-400 font-mono">{health.database.url}</p>
                  )}
                  {key === "cdn" && (
                    <p className="text-xs text-slate-400">Hero image, ícones, uploads</p>
                  )}
                  {key === "version" && health && (
                    <p className="text-xs text-slate-400 font-mono">v{health.version}</p>
                  )}
                </div>
              </div>
              {key === "api" && statusBadge(health ? health.status === "healthy" : false)}
              {key === "database" && statusBadge(health ? health.database.status === "connected" : false)}
              {key === "migrations" && statusBadge(health ? health.stats.users > 0 : false)}
              {key === "auth" && statusBadge(health ? health.stats.users > 0 : false)}
              {key === "cdn" && statusBadge(cdnOk)}
              {key === "version" && health && (
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">v{health.version}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {health && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Usuários", value: health.stats.users },
            { label: "Fretes", value: health.stats.freights },
            { label: "Ambiente", value: process.env.NODE_ENV || "development" },
            { label: "SSL", value: health.database.ssl ? "Ativo" : "Inativo" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {health?.database.error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-800 dark:text-red-300">
          <strong>Erro do banco:</strong> {health.database.error}
        </div>
      )}

      <div className="mt-8 text-center text-xs text-slate-400">
        <Link href="/" className="text-orange-600 hover:underline">Voltar ao início</Link> · Atualizado em {new Date().toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}
