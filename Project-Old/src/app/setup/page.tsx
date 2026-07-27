"use client";

import { useState } from "react";
import { IcTruck, IcCheck, IcX } from "@/components/Icons";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function runSetup() {
    setStatus("running");
    setMessage("Criando tabelas no banco de dados...");

    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage(`✅ ${data.message} (${data.tables_created} tabelas criadas)`);
      } else {
        setStatus("error");
        setMessage(`❌ Erro: ${data.error}\n💡 ${data.hint}`);
      }
    } catch (e: any) {
      setStatus("error");
      setMessage(`❌ Erro de conexão: ${e.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 mx-auto mb-4">
            <IcTruck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Inicializar FreteTruck</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Esta ação cria todas as tabelas necessárias no banco de dados Neon.
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Execute apenas UMA VEZ após o deploy.
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-xl text-sm whitespace-pre-line ${
              status === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300"
                : status === "error"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
                : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300"
            }`}
          >
            {message}
          </div>
        )}

        {status === "success" ? (
          <a
            href="/"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-center"
          >
            Ir para o início →
          </a>
        ) : (
          <button
            onClick={runSetup}
            disabled={status === "running"}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status === "running" ? "Criando tabelas..." : "Criar tabelas no banco"}
          </button>
        )}

        <div className="mt-4 text-center">
          <a href="/api/health" className="text-xs text-slate-400 hover:text-orange-600">
            Verificar status do banco →
          </a>
        </div>
      </div>
    </div>
  );
}
