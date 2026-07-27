"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", type: "bug", priority: "normal", pageUrl: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm((f) => ({ ...f, pageUrl: document.referrer || window.location.origin }));
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) setForm((f) => ({ ...f, name: d.user.name || "", email: d.user.email || "" }));
    }).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Erro ao enviar feedback."); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl font-bold">✓</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Feedback enviado</h1>
          <p className="mt-2 text-sm text-slate-500">Obrigado! Seu relato foi registrado e será analisado pela equipe.</p>
          <Link href="/" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";
  const label = "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Enviar feedback</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">Relate bugs, sugestões, problemas fiscais, GPS, pagamentos ou melhorias.</p>

      <form onSubmit={submit} className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={label}>Nome</label><input className={input} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className={label}>E-mail</label><input className={input} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={label}>Tipo</label><select className={input} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}><option value="bug">Bug / erro</option><option value="ideia">Ideia / sugestão</option><option value="financeiro">Pagamentos / Trucks</option><option value="fiscal">Fiscal CT-e / MDF-e</option><option value="gps">Mapas / GPS</option><option value="elogio">Elogio</option><option value="outro">Outro</option></select></div>
          <div><label className={label}>Prioridade</label><select className={input} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></div>
        </div>
        <div><label className={label}>Página relacionada</label><input className={input} value={form.pageUrl} onChange={(e) => setForm((f) => ({ ...f, pageUrl: e.target.value }))} /></div>
        <div><label className={label}>Mensagem *</label><textarea className={input} rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Descreva o problema ou sugestão com detalhes..." required /></div>
        <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors">{loading ? "Enviando..." : "Enviar feedback"}</button>
      </form>
    </div>
  );
}
