"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IcShield, IcRefresh, IcCheck } from "@/components/Icons";

type TableInfo = { table_name: string; count: number };

export default function AdminBancoPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/db-tools");
      const data = await res.json();
      if (res.ok) {
        setTables(data.tables || []);
      } else {
        setError(data.error || "Erro ao carregar tabelas.");
      }
    } catch {
      setError("Erro de conexão com o banco.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction(action: "sync_schema" | "seed_demo") {
    setBusy(action);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/db-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "✅ Ação concluída com sucesso!");
        await load();
      } else {
        setError(data.error || "Erro na operação.");
      }
    } catch {
      setError("Erro ao executar ação.");
    }
    setBusy(null);
  }

  const totalRows = tables.reduce((acc, t) => acc + (Number(t.count) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">
        ← Painel admin
      </Link>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
            <IcShield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Gestão do Banco & Ferramentas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Crie tabelas, popule dados demo e inspecione as estatísticas em tempo real do banco de dados.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <IcRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar contagem
        </button>
      </div>

      {message && (
        <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <IcCheck className="w-5 h-5 text-emerald-600" /> {message}
        </div>
      )}
      {error && (
        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4 text-sm font-semibold text-red-800 dark:text-red-300">
          ❌ {error}
        </div>
      )}

      {/* Ações de Administração do Banco */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Verificar & Criar Tabelas
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Verifica se todas as 18+ tabelas do sistema estão presentes no PostgreSQL e executa <code className="text-orange-500 font-mono">CREATE TABLE IF NOT EXISTS</code> para qualquer tabela ausente (incluindo Mídias, Cupons e Denúncias).
            </p>
          </div>
          <button
            onClick={() => runAction("sync_schema")}
            disabled={busy !== null}
            className="mt-6 w-full bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {busy === "sync_schema" ? "Criando tabelas..." : "🗄️ Verificar & Criar Tabelas Agora"}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Popular Dados Demo (Seed)
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Insere fretes de exemplo do agronegócio brasileiro, usuários de teste (embarcadora, transportadora, motorista) e postagens no mural sem causar erros de duplicata.
            </p>
          </div>
          <button
            onClick={() => runAction("seed_demo")}
            disabled={busy !== null}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {busy === "seed_demo" ? "Populando dados..." : "🌱 Popular Dados Demo (Seed)"}
          </button>
        </div>
      </div>

      {/* Lista de Tabelas */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Estatísticas das Tabelas do PostgreSQL
          </span>
          <span className="text-xs font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full">
            Total Registros: {totalRows.toLocaleString("pt-BR")}
          </span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400">Carregando tabelas do banco...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                <tr>
                  <th className="text-left px-6 py-3">Tabela</th>
                  <th className="text-right px-6 py-3">Linhas Registradas</th>
                  <th className="text-right px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {tables.map((t) => (
                  <tr key={t.table_name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {t.table_name}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-orange-500">
                      {Number(t.count).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full">
                        <IcCheck className="w-3.5 h-3.5" /> Ativa
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
