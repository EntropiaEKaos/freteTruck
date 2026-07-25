"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 mx-auto mb-4 text-3xl font-bold">
            🚛
          </div>
          <h1 className="text-2xl font-extrabold text-white">Erro crítico de carregamento</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Não foi possível inicializar a aplicação FreteTruck. Se você está executando no Vercel ou Fly.io, verifique se as variáveis de ambiente (como DATABASE_URL) estão corretamente configuradas no painel do servidor.
          </p>
          <div className="mt-4 p-3 bg-slate-950 rounded-xl text-left font-mono text-xs text-red-400 overflow-x-auto">
            <p>{error.message || "Erro desconhecido ao carregar aplicação."}</p>
          </div>
          <button
            onClick={() => reset()}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
          >
            Tentar recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
