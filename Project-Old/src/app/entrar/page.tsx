"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao entrar.");
        return;
      }
      router.push("/painel");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 4v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white text-center">Entrar</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">Acesse sua conta no FreteTruck</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center">
            <Link href="/esqueci-senha" className="text-xs text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
            Cadastre-se grátis
          </Link>
        </p>

        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300 text-center">
          <span className="font-bold">BETA</span> — Quer apenas testar? Use <b>demo@fretetruck.com.br</b> / <b>demo123</b>
        </div>
      </div>
    </div>
  );
}
