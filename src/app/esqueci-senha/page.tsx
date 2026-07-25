"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSent(true);
      if (data.devLink) setDevLink(data.devLink);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">E-mail enviado</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.</p>
          {devLink && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-left">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Modo desenvolvimento:</p>
              <a href={devLink} className="text-xs text-blue-600 break-all hover:underline">{devLink}</a>
            </div>
          )}
          <Link href="/entrar" className="mt-6 inline-block text-sm text-orange-600 font-semibold hover:underline">Voltar ao login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">Informe seu e-mail e enviaremos um link para redefinir.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Lembrou a senha? <Link href="/entrar" className="text-orange-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
