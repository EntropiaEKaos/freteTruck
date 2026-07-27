"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetContent() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } finally { setLoading(false); }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Token não informado</h1>
          <p className="mt-2 text-sm text-slate-500">Use o link enviado para seu e-mail.</p>
          <Link href="/esqueci-senha" className="mt-4 inline-block text-orange-600 font-semibold hover:underline text-sm">Solicitar novo link</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Senha alterada!</h1>
          <p className="mt-2 text-sm text-slate-500">Agora você pode entrar com sua nova senha.</p>
          <Link href="/entrar" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center">Redefinir senha</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nova senha</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar senha</label>
            <input type="password" required minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white" placeholder="Repita a senha" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {loading ? "Alterando..." : "Redefinir senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
