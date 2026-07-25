"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { Freight, Proposal, Alert } from "@/db/schema";
import { formatBRL, formatWeight, timeAgo, UFS, VEHICLE_TYPES } from "@/lib/constants";
import FreightCard from "@/components/FreightCard";

type FreightRow = { freight: Freight; ownerName: string; ownerCompany: string | null };
type ReceivedProposal = { proposal: Proposal; freight: Freight; driverName: string; driverPhone: string; driverVehicle: string | null };
type SentProposal = { proposal: Proposal; freight: Freight };
type Me = { id: number; name: string; role: string; email: string } | null;
type Tab = "fretes" | "recebidas" | "enviadas" | "favoritos" | "alertas";

export default function DashboardPage() {
  const [me, setMe] = useState<Me>(null);
  const [state, setState] = useState<"loading" | "guest" | "ok">("loading");
  const [tab, setTab] = useState<Tab>("fretes");
  const [busy, setBusy] = useState<number | null>(null);

  const [rows, setRows] = useState<FreightRow[]>([]);
  const [received, setReceived] = useState<ReceivedProposal[]>([]);
  const [sent, setSent] = useState<SentProposal[]>([]);
  const [favs, setFavs] = useState<FreightRow[]>([]);
  const [alertList, setAlertList] = useState<Alert[]>([]);

  const [alertForm, setAlertForm] = useState({ originState: "", destState: "", vehicleType: "" });

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me").then((r) => r.json());
    if (!meRes.user) {
      setState("guest");
      return;
    }
    setMe(meRes.user);
    const [mine, rec, snt, fav, alr] = await Promise.all([
      fetch("/api/freights?mine=1").then((r) => r.json()),
      fetch("/api/proposals?received=1").then((r) => r.json()),
      fetch("/api/proposals").then((r) => r.json()),
      fetch("/api/favorites").then((r) => r.json()),
      fetch("/api/alerts").then((r) => r.json()),
    ]);
    setRows(mine.freights || []);
    setReceived(rec.proposals || []);
    setSent(snt.proposals || []);
    setFavs(fav.freights || []);
    setAlertList(alr.alerts || []);
    setState("ok");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(f: Freight) {
    setBusy(f.id);
    await fetch(`/api/freights/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: f.status === "ativo" ? "fechado" : "ativo" }),
    });
    await load();
    setBusy(null);
  }

  async function removeFreight(f: Freight) {
    if (!confirm(`Excluir o frete ${f.originCity}/${f.originState} → ${f.destCity}/${f.destState}?`)) return;
    setBusy(f.id);
    await fetch(`/api/freights/${f.id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  async function respondProposal(id: number, status: "aceita" | "recusada") {
    setBusy(id);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(null);
  }

  async function cancelProposal(id: number) {
    if (!confirm("Cancelar esta proposta?")) return;
    setBusy(id);
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertForm),
    });
    if (res.ok) {
      setAlertForm({ originState: "", destState: "", vehicleType: "" });
      await load();
    }
  }

  async function deleteAlert(id: number) {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (state === "loading") {
    return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>;
  }

  if (state === "guest") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Área restrita</h1>
        <p className="mt-2 text-slate-500 text-sm">Entre na sua conta para acessar o painel.</p>
        <Link href="/entrar" className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">
          Entrar
        </Link>
      </div>
    );
  }

  const active = rows.filter((r) => r.freight.status === "ativo").length;
  const totalViews = rows.reduce((s, r) => s + r.freight.views, 0);
  const pendingReceived = received.filter((r) => r.proposal.status === "pendente").length;

  const statusBadge = (s: string) => (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
        s === "pendente" ? "bg-amber-100 text-amber-700" : s === "aceita" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
      }`}
    >
      {s === "pendente" ? "⏳ Pendente" : s === "aceita" ? "✅ Aceita" : "❌ Recusada"}
    </span>
  );

  const tabBtn = (t: Tab, label: string, badge?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
        tab === t ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
      }`}
    >
      {label}
      {badge ? <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span> : null}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Meu painel</h1>
          <p className="mt-1 text-slate-500">
            {me?.name} · {me?.role === "motorista" ? "🚛 Motorista" : "🏭 Embarcador"}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/freights/export" download className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
            Exportar CSV
          </a>
          <Link href="/configuracoes" className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
            Configurações
          </Link>
          <Link href="/publicar" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            + Publicar frete
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Fretes publicados", value: rows.length },
          { label: "Fretes ativos", value: active },
          { label: "Visualizações", value: totalViews },
          { label: "Propostas pendentes", value: pendingReceived },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <p className="text-3xl font-extrabold text-slate-900">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs md:text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {tabBtn("fretes", "📦 Meus fretes")}
        {tabBtn("recebidas", "📥 Propostas recebidas", pendingReceived)}
        {tabBtn("enviadas", "📤 Minhas propostas")}
        {tabBtn("favoritos", "❤️ Favoritos")}
        {tabBtn("alertas", "🔔 Alertas de rota")}
      </div>

      <div className="mt-5">
        {/* ==== MEUS FRETES ==== */}
        {tab === "fretes" &&
          (rows.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-5xl">📦</p>
              <p className="mt-4 font-bold text-slate-900">Você ainda não publicou nenhum frete</p>
              <Link href="/publicar" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">
                Publicar meu primeiro frete →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ freight: f }) => (
                <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          f.status === "ativo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {f.status === "ativo" ? "● Ativo" : "○ Fechado"}
                      </span>
                      <Link href={`/fretes/${f.id}`} className="font-bold text-slate-900 hover:text-orange-600">
                        {f.originCity}/{f.originState} → {f.destCity}/{f.destState}
                      </Link>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {f.cargoType} · {formatWeight(f.weightKg)} ·{" "}
                      {f.priceType === "combinar" || !f.price
                        ? "A combinar"
                        : f.priceType === "tonelada"
                          ? `${formatBRL(f.price)}/ton`
                          : formatBRL(f.price)}{" "}
                      · {timeAgo(f.createdAt)} · 👁 {f.views}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/fretes/${f.id}/editar`}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => toggleStatus(f)}
                      disabled={busy === f.id}
                      className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                        f.status === "ativo"
                          ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                          : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {f.status === "ativo" ? "Fechar frete" : "Reativar"}
                    </button>
                    <button
                      onClick={() => removeFreight(f)}
                      disabled={busy === f.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* ==== PROPOSTAS RECEBIDAS ==== */}
        {tab === "recebidas" &&
          (received.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-5xl">📥</p>
              <p className="mt-4 font-bold text-slate-900">Nenhuma proposta recebida ainda</p>
              <p className="mt-1 text-sm text-slate-500">Quando motoristas enviarem propostas nos seus fretes, elas aparecem aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {received.map(({ proposal: p, freight: f, driverName, driverPhone, driverVehicle }) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(p.status)}
                        <Link href={`/fretes/${f.id}`} className="font-bold text-slate-900 hover:text-orange-600 text-sm">
                          {f.originCity}/{f.originState} → {f.destCity}/{f.destState}
                        </Link>
                        <span className="text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        🚛 <b>{driverName}</b>
                        {driverVehicle ? ` · ${driverVehicle}` : ""} · Proposta:{" "}
                        <b className="text-emerald-600">{p.amount ? formatBRL(p.amount) : "a combinar"}</b>
                      </p>
                      {p.message && <p className="mt-1 text-sm text-slate-500 italic">&ldquo;{p.message}&rdquo;</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {p.status === "pendente" && (
                        <>
                          <button
                            onClick={() => respondProposal(p.id, "aceita")}
                            disabled={busy === p.id}
                            className="text-sm font-bold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                          >
                            ✓ Aceitar
                          </button>
                          <button
                            onClick={() => respondProposal(p.id, "recusada")}
                            disabled={busy === p.id}
                            className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                      {p.status === "aceita" && (
                        <a
                          href={`https://wa.me/55${driverPhone}?text=${encodeURIComponent(`Olá ${driverName}! Aceitei sua proposta no FreteTruck para o frete ${f.originCity}/${f.originState} → ${f.destCity}/${f.destState}. Vamos combinar os detalhes?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          💬 WhatsApp do motorista
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* ==== MINHAS PROPOSTAS ==== */}
        {tab === "enviadas" &&
          (sent.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-5xl">📤</p>
              <p className="mt-4 font-bold text-slate-900">Você ainda não enviou propostas</p>
              <Link href="/fretes" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">
                Buscar fretes disponíveis →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sent.map(({ proposal: p, freight: f }) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusBadge(p.status)}
                      <Link href={`/fretes/${f.id}`} className="font-bold text-slate-900 hover:text-orange-600 text-sm">
                        {f.originCity}/{f.originState} → {f.destCity}/{f.destState}
                      </Link>
                      <span className="text-xs text-slate-400">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {f.cargoType} · Sua proposta: <b className="text-emerald-600">{p.amount ? formatBRL(p.amount) : "a combinar"}</b>
                    </p>
                    {p.status === "aceita" && (
                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        🎉 Proposta aceita! Contato do embarcador: {f.contactName} —{" "}
                        <a
                          href={`https://wa.me/55${f.contactPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          chamar no WhatsApp
                        </a>
                      </p>
                    )}
                  </div>
                  {p.status === "pendente" && (
                    <button
                      onClick={() => cancelProposal(p.id)}
                      disabled={busy === p.id}
                      className="text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* ==== FAVORITOS ==== */}
        {tab === "favoritos" &&
          (favs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-5xl">❤️</p>
              <p className="mt-4 font-bold text-slate-900">Nenhum frete salvo</p>
              <p className="mt-1 text-sm text-slate-500">Toque em &ldquo;Salvar frete&rdquo; na página de um frete para guardá-lo aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favs.map((row) => (
                <FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} />
              ))}
            </div>
          ))}

        {/* ==== ALERTAS ==== */}
        {tab === "alertas" && (
          <div className="space-y-5">
            <form onSubmit={createAlert} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="font-bold text-slate-900">Criar alerta de rota</p>
              <p className="text-sm text-slate-500 mt-1">Salve suas rotas preferidas e veja fretes compatíveis com 1 clique.</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={alertForm.originState}
                  onChange={(e) => setAlertForm((f) => ({ ...f, originState: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Origem (qualquer)</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <select
                  value={alertForm.destState}
                  onChange={(e) => setAlertForm((f) => ({ ...f, destState: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Destino (qualquer)</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <select
                  value={alertForm.vehicleType}
                  onChange={(e) => setAlertForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Caminhão (qualquer)</option>
                  {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg py-2.5 text-sm">
                  + Criar alerta
                </button>
              </div>
            </form>

            {alertList.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                Nenhum alerta criado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {alertList.map((a) => {
                  const qs = new URLSearchParams();
                  if (a.originState) qs.set("originState", a.originState);
                  if (a.destState) qs.set("destState", a.destState);
                  if (a.vehicleType) qs.set("vehicle", a.vehicleType);
                  return (
                    <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center gap-3">
                      <p className="flex-1 min-w-[200px] font-semibold text-slate-900 text-sm">
                        🔔 {a.originState || "Qualquer origem"} → {a.destState || "Qualquer destino"}
                        {a.vehicleType ? ` · 🚚 ${a.vehicleType}` : ""}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href={`/fretes?${qs.toString()}`}
                          className="text-sm font-bold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Ver fretes
                        </Link>
                        <button
                          onClick={() => deleteAlert(a.id)}
                          className="text-sm font-semibold px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
