"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IcShield, IcUser, IcDoc, IcTruck, IcCheck, IcX, IcGift, IcChart } from "@/components/Icons";

type Stats = Record<string, number>;

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({});
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me").then(r => r.json());
        if (!meRes.user || meRes.user.role !== "admin") {
          setError("Acesso restrito a administradores.");
          setLoading(false);
          return;
        }
        setAuthorized(true);
        const [adminRes, docsRes] = await Promise.all([
          fetch("/api/admin").then(r => r.json()),
          fetch("/api/admin/documents").then(r => r.json()),
        ]);
        setStats(adminRes.stats || {});
        setRecentUsers(adminRes.recentUsers || []);
        setPendingDocs(docsRes.documents || []);
      } catch {
        setError("Erro ao carregar painel.");
      }
      setLoading(false);
    })();
  }, []);

  async function handleDocReview(docId: number, approve: boolean) {
    await fetch(`/api/admin/documents/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: approve ? "aprovado" : "rejeitado", comment: approve ? "" : "Documento ilegível ou inválido" }),
    });
    const docsRes = await fetch("/api/admin/documents").then(r => r.json());
    setPendingDocs(docsRes.documents || []);
    const adminRes = await fetch("/api/admin").then(r => r.json());
    setStats(adminRes.stats || {});
  }

  async function grantCredits(userId: number, amount: number) {
    await fetch("/api/admin/monetization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "grant", userId, trucks: amount, description: "Bônus administrativo" }),
    });
    alert(`${amount} Trucks creditados com sucesso.`);
  }

  async function toggleVerified(userId: number, verified: boolean) {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified }),
    });
    const adminRes = await fetch("/api/admin").then(r => r.json());
    setRecentUsers(adminRes.recentUsers || []);
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando painel administrativo...</div>;

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <IcShield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Acesso Restrito</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error || "Você não tem permissão para acessar esta área."}</p>
        <p className="mt-4 text-xs text-slate-400">Atalho de acesso: <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl+Shift+A</kbd></p>
        <Link href="/" className="mt-6 inline-block text-orange-600 font-medium hover:underline text-sm">Voltar ao início</Link>
      </div>
    );
  }

  const statCards = [
    { label: "Usuários", value: stats.totalUsers || 0, sub: `${stats.motoristas || 0} mot. · ${stats.embarcadores || 0} emb.`, color: "from-blue-500 to-indigo-600" },
    { label: "Verificados", value: stats.verifiedUsers || 0, color: "from-emerald-500 to-teal-600" },
    { label: "Fretes ativos", value: stats.activeFreights || 0, sub: `${stats.closedFreights || 0} fechados`, color: "from-orange-500 to-amber-600" },
    { label: "Total fretes", value: stats.totalFreights || 0, color: "from-violet-500 to-purple-600" },
    { label: "Docs pendentes", value: stats.pendingDocs || 0, color: stats.pendingDocs > 0 ? "from-red-500 to-rose-600" : "from-slate-500 to-slate-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <IcShield className="w-7 h-7 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel Administrativo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie usuários, documentos e métricas do sistema.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/integracoes" className="text-xs font-bold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">
            Mapas & GPS
          </Link>
          <Link href="/admin/monetizacao" className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            Monetização
          </Link>
          <Link href="/admin/logs" className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 transition-colors">
            Logs de Auditoria
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
            <p className="text-2xl font-bold">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-[10px] opacity-60 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <IcUser className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-sm text-slate-900 dark:text-white">Usuários recentes</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email} · {u.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleVerified(u.id, !u.verified)}
                    className={`text-xs font-medium px-2 py-1 rounded ${u.verified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
                    {u.verified ? "Verificado" : "Verificar"}
                  </button>
                  <button onClick={() => grantCredits(u.id, 50)}
                    className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">
                    +50 Trucks
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending docs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IcDoc className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Documentos pendentes</span>
            </div>
            {pendingDocs.length > 0 && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">{pendingDocs.length} aguardando</span>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
            {pendingDocs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <IcCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Nenhum documento pendente.</p>
              </div>
            ) : (
              pendingDocs.map((item: any) => (
                <div key={item.doc.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.userName}</p>
                    <p className="text-xs text-slate-500">{item.doc.docType.toUpperCase()} · {new Date(item.doc.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleDocReview(item.doc.id, true)}
                      className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 transition-colors" title="Aprovar">
                      <IcCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDocReview(item.doc.id, false)}
                      className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors" title="Rejeitar">
                      <IcX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Access info */}
      <div className="mt-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Acesso rápido: <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-600">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-600">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono border border-slate-300 dark:border-slate-600">A</kbd> de qualquer página. Visível apenas para contas com role admin.
        </p>
      </div>
    </div>
  );
}
