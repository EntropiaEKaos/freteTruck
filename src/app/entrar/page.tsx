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
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 text-center">Entrar no FreteTruck</h1>
        <p className="mt-1 text-sm text-slate-500 text-center">Acesse sua conta para publicar e gerenciar fretes</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

          <div>
            <label className="text-sm font-semibold text-slate-700">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-right mt-2">
            <Link href="/esqueci-senha" className="text-xs text-slate-500 hover:text-orange-600 transition-colors">
              Esqueceu a senha?
            </Link>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-orange-600 font-semibold hover:underline">
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
