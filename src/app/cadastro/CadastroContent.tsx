"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { UFS, VEHICLE_TYPES, BODY_TYPES } from "@/lib/constants";

export default function CadastroContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const refCode = sp.get("ref") || "";

  const [role, setRole] = useState<"motorista" | "embarcador">("motorista");
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "",
    company: "", city: "", state: "", vehicleType: "", bodyType: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!acceptTerms) {
      setError("É necessário aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role, refCode, acceptTerms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        return;
      }
      router.push(role === "embarcador" ? "/publicar" : "/fretes");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";
  const labelCls = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white text-center">Crie sua conta grátis</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">Leva menos de 1 minuto</p>

        {refCode && (
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">🎁 Você foi convidado!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Código: <b>{refCode}</b> — ambos ganham R$25 em créditos</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setRole("motorista")}
            className={`rounded-xl border-2 p-4 text-center transition-colors ${role === "motorista" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-600 hover:border-slate-300"}`}>
            <div className="text-3xl">🚛</div>
            <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">Sou Motorista</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quero encontrar cargas</p>
          </button>
          <button type="button" onClick={() => setRole("embarcador")}
            className={`rounded-xl border-2 p-4 text-center transition-colors ${role === "embarcador" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-600 hover:border-slate-300"}`}>
            <div className="text-3xl">🏭</div>
            <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">Sou Embarcador</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Quero publicar fretes</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

          <div>
            <label className={labelCls}>Nome completo *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="João da Silva" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>E-mail *</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="seu@email.com" />
            </div>
            <div>
              <label className={labelCls}>WhatsApp *</label>
              <input required value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} placeholder="(65) 99999-9999" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Senha *</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} placeholder="Mínimo 6 caracteres" />
          </div>

          {role === "embarcador" && (
            <div>
              <label className={labelCls}>Empresa / Transportadora</label>
              <input value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls} placeholder="Nome da empresa (opcional)" />
            </div>
          )}

          <div className="grid grid-cols-[1fr_100px] gap-4">
            <div>
              <label className={labelCls}>Cidade</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} placeholder="Sua cidade" />
            </div>
            <div>
              <label className={labelCls}>UF</label>
              <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls}>
                <option value="">--</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {role === "motorista" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Seu caminhão</label>
                <select value={form.vehicleType} onChange={(e) => set("vehicleType", e.target.value)} className={inputCls}>
                  <option value="">Selecione</option>
                  {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Carroceria</label>
                <select value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)} className={inputCls}>
                  <option value="">Selecione</option>
                  {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-orange-500 shrink-0"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/termos" target="_blank" className="text-orange-600 font-semibold hover:underline">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-orange-600 font-semibold hover:underline">Política de Privacidade (LGPD)</Link>{" "}
              do FreteTruck.
            </span>
          </label>

          <button type="submit" disabled={loading || !acceptTerms}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Já tem conta?{" "}
          <Link href="/entrar" className="text-orange-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
