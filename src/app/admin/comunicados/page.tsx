"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SystemAnnouncement } from "@/db/schema";

export default function AdminComunicadosPage() {
  const [items, setItems] = useState<SystemAnnouncement[]>([]);
  const [form, setForm] = useState({ title: "", message: "", variant: "info", linkLabel: "", linkUrl: "", active: true });
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/announcements");
    if (res.ok) setItems((await res.json()).announcements || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title.trim() || !form.message.trim()) return alert("Título e mensagem são obrigatórios.");
    await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", message: "", variant: "info", linkLabel: "", linkUrl: "", active: true });
    await load();
  }

  async function toggle(item: SystemAnnouncement) {
    await fetch("/api/admin/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, active: !item.active }) });
    await load();
  }

  const input = "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Comunicados Globais</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Crie avisos dinâmicos exibidos no topo do site.</p>

      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <p className="font-bold text-sm mb-3">Novo comunicado</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className={input} placeholder="Título" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <select className={input} value={form.variant} onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))}><option value="info">Info</option><option value="success">Sucesso</option><option value="warning">Aviso</option><option value="danger">Urgente</option></select>
          <input className={input} placeholder="Texto do botão (opcional)" value={form.linkLabel} onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))} />
          <input className={input} placeholder="URL do botão (opcional)" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
        </div>
        <textarea className={`${input} mt-3 w-full`} rows={3} placeholder="Mensagem" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        <button onClick={create} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-lg text-sm">Publicar comunicado</button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-slate-500">Carregando...</p> : items.map((i) => (
          <div key={i.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]"><p className="font-bold text-slate-900 dark:text-white">{i.title}</p><p className="text-sm text-slate-500 dark:text-slate-400">{i.message}</p><p className="text-xs text-slate-400 mt-1">Variante: {i.variant}</p></div>
            <button onClick={() => toggle(i)} className={`text-xs font-bold px-4 py-2 rounded-lg ${i.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{i.active ? "Ativo" : "Inativo"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
