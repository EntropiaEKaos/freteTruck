"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IcTruck, IcRefresh, IcHome } from "@/components/Icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Error:", error);
  }, [error]);

  const isDbError =
    error.message?.toLowerCase().includes("database") ||
    error.message?.toLowerCase().includes("connect") ||
    error.message?.toLowerCase().includes("timeout") ||
    error.message?.toLowerCase().includes("pool") ||
    error.message?.toLowerCase().includes("postgres") ||
    error.message?.toLowerCase().includes("missing_db");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4">
          <IcTruck className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isDbError ? "Erro de conexão com o banco" : "Ocorreu um erro no sistema"}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {isDbError
            ? "Não foi possível conectar ao banco de dados PostgreSQL. Se você acabou de publicar no Vercel, verifique se a variável DATABASE_URL está configurada corretamente nas variáveis de ambiente."
            : "Tivemos um problema inesperado ao carregar esta página. Tente recarregar ou volte à página inicial."}
        </p>

        {process.env.NODE_ENV !== "production" || error.digest ? (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-left font-mono text-xs text-slate-600 dark:text-slate-400 overflow-x-auto max-h-32">
            <p className="font-bold text-red-600 dark:text-red-400">Detalhe do erro:</p>
            <p className="mt-1 break-all">{error.message}</p>
            {error.digest && <p className="mt-1 text-slate-400">Digest: {error.digest}</p>}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <IcRefresh className="w-4 h-4" /> Tentar novamente
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            <IcHome className="w-4 h-4" /> Início
          </Link>
        </div>
      </div>
    </div>
  );
}
