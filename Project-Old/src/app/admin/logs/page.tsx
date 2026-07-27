"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/constants";
import { IcDoc, IcShield } from "@/components/Icons";
import type { AuditLog } from "@/db/schema";

const ACTION_LABELS: Record<string, string> = {
  "auth.register": "Cadastro",
  "auth.login": "Login",
  "auth.password_reset": "Reset de senha",
  "auth.account_deleted": "Conta excluída",
  "freight.create": "Frete criado",
  "freight.update": "Frete editado",
  "freight.close": "Frete fechado",
  "freight.delete": "Frete excluído",
  "proposal.create": "Proposta criada",
  "proposal.accept": "Proposta aceita",
  "proposal.reject": "Proposta recusada",
  "document.upload": "Doc enviado",
  "admin.document_approve": "Doc aprovado",
  "admin.document_reject": "Doc rejeitado",
  "admin.credits_grant": "Créditos dados",
  "admin.user_verify": "Usuário verificado",
  "admin.user_role_change": "Role alterada",
  "data.export": "Dados exportados",
  "terms.accepted": "Termos aceitos",
  "fiscal.create": "Doc fiscal criado",
  "fiscal.emit": "Doc fiscal emitido",
  "fiscal.cancel": "Doc fiscal cancelado",
};

const ACTION_COLORS: Record<string, string> = {
  auth: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  freight: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  proposal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  fiscal: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  data: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  terms: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState("");
  const [days, setDays] = useState("30");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (days) params.set("days", days);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setLogs(data.logs || []);
    setActions(data.actions || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [action, days]); // eslint-disable-line react-hooks/exhaustive-deps

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <IcShield className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-500">Somente administradores podem ver os logs de auditoria.</p>
        <Link href="/" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>
      <div className="mt-2 flex items-center gap-3">
        <IcDoc className="w-7 h-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Logs de Auditoria</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Registro completo de ações do sistema — rastreabilidade e conformidade.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Ação</label>
          <select value={action} onChange={(e) => setAction(e.target.value)}
            className="block mt-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            <option value="">Todas as ações</option>
            {actions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Período</label>
          <select value={days} onChange={(e) => setDays(e.target.value)}
            className="block mt-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            <option value="1">Últimas 24h</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="0">Todo o período</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Buscar por e-mail</label>
          <div className="flex gap-2 mt-1">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="usuario@email.com"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              onKeyDown={(e) => e.key === "Enter" && load()} />
            <button onClick={load} className="bg-slate-900 dark:bg-orange-500 text-white font-bold px-4 py-2 rounded-lg text-sm">Buscar</button>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Carregando logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">Nenhum log encontrado com esses filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3">Quando</th>
                  <th className="text-left px-4 py-3">Quem</th>
                  <th className="text-left px-4 py-3">Ação</th>
                  <th className="text-left px-4 py-3">Entidade</th>
                  <th className="text-left px-4 py-3">Detalhes</th>
                  <th className="text-left px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {logs.map((log) => {
                  const colorKey = log.action.split(".")[0];
                  const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap" title={new Date(log.createdAt).toLocaleString("pt-BR")}>{timeAgo(log.createdAt)}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{log.actorEmail || `#${log.userId ?? "sistema"}`}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[colorKey] || ACTION_COLORS.data}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{log.entity}{log.entityId ? ` #${log.entityId}` : ""}</td>
                      <td className="px-4 py-2.5 text-slate-400 max-w-[260px] truncate font-mono" title={JSON.stringify(details)}>
                        {details ? JSON.stringify(details) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono">{log.ip || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {logs.length} registros · Logs de auditoria são gravados em todas as ações sensíveis do sistema e não podem ser editados.
      </p>
    </div>
  );
}
