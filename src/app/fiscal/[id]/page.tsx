"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FiscalDocument, FiscalEvent } from "@/db/schema";
import { timeAgo } from "@/lib/constants";
import { IcDoc, IcCheck, IcX, IcShield } from "@/components/Icons";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const EVENT_LABELS: Record<string, string> = {
  emissao: "Autorização de uso",
  cancelamento: "Cancelamento",
  carta_correcao: "Carta de correção (CC-e)",
  encerramento: "Encerramento",
  consulta: "Consulta de status",
};

export default function FiscalDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<FiscalDocument | null>(null);
  const [events, setEvents] = useState<FiscalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "cancelar" | "carta_correcao" | "encerrar">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [dRes, eRes] = await Promise.all([
      fetch("/api/fiscal").then((r) => r.json()),
      fetch(`/api/fiscal/${id}/events`).then((r) => r.json()),
    ]);
    const found = (dRes.documents || []).find((x: { document: FiscalDocument }) => x.document.id === Number(id));
    setDoc(found?.document || null);
    setEvents(eRes.events || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function runAction(action: string, withReason?: string) {
    setBusy(true);
    setError("");
    const loadingToast = toast.loading("Processando...");
    
    const res = await fetch(`/api/fiscal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: withReason }),
    });
    const data = await res.json();
    
    toast.dismiss(loadingToast);
    
    if (!res.ok) {
      toast.error(data.error || "Erro na operação.");
      setError(data.error || "Erro na operação.");
    } else {
      setModal(null);
      setReason("");
      if (action === "emitir") {
        toast.success("Autorizado pela SEFAZ!");
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        toast.success("Operação realizada com sucesso!");
      }
      await load();
    }
    setBusy(false);
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-24 text-center text-slate-500">Carregando documento fiscal…</div>;
  if (!doc) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Documento não encontrado</h1>
      <Link href="/fiscal" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Voltar</Link>
    </div>
  );

  const statusColors: Record<string, string> = {
    rascunho: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    pronto_para_emitir: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    autorizado_simulado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    encerrado_simulado: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/fiscal" className="text-sm text-orange-600 font-semibold hover:underline">← Central fiscal</Link>

      <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <IcDoc className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase">{doc.docType} #{doc.id}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[doc.status] || statusColors.rascunho}`}>
                {doc.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
          {doc.docType === "cte" ? (
            <Link href={`/fiscal/${id}/dacte`} className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800">
              Ver DACTE (PDF)
            </Link>
          ) : (
            <Link href={`/fiscal/${id}/dacte`} className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800">
              Ver DAMDFE (PDF)
            </Link>
          )}
        </div>

        {doc.accessKey && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-slate-400">Chave de acesso</p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all mt-1">{doc.accessKey}</p>
          </div>
        )}
        {doc.protocol && <p className="mt-2 text-xs font-mono text-emerald-600">Protocolo de autorização: {doc.protocol}</p>}
        {doc.errorMessage && <p className="mt-2 text-xs text-red-500">{doc.errorMessage}</p>}

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          <a href={`/api/fiscal/${id}`} className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Baixar XML</a>
          {doc.status === "pronto_para_emitir" && (
            <button onClick={() => runAction("emitir")} disabled={busy} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
              Simular autorização SEFAZ
            </button>
          )}
          {doc.status === "autorizado_simulado" && (
            <>
              <button onClick={() => setModal("carta_correcao")} className="text-xs font-semibold px-3 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">Carta de correção</button>
              {doc.docType === "mdfe" && (
                <button onClick={() => setModal("encerrar")} className="text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50">Encerrar MDF-e</button>
              )}
              <button onClick={() => setModal("cancelar")} className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">Cancelar</button>
            </>
          )}
        </div>
      </div>

      {/* Modal for reason */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {modal === "cancelar" ? "Cancelar documento" : modal === "carta_correcao" ? "Carta de Correção (CC-e)" : "Encerrar MDF-e"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {modal === "encerrar" ? "Informe o motivo do encerramento (fim da viagem)." : "Justificativa obrigatória — mínimo 15 caracteres (exigência SEFAZ)."}
            </p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
              placeholder="Descreva o motivo..." />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => { setModal(null); setReason(""); setError(""); }} className="text-sm px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">Voltar</button>
              <button disabled={busy} onClick={() => runAction(modal, reason)}
                className="text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-50">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events timeline */}
      <div className="mt-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <IcShield className="w-4 h-4 text-orange-500" /> Histórico de eventos
        </h2>
        {events.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 text-sm">
            Nenhum evento registrado ainda.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-4">
            {events.map((ev) => (
              <div key={ev.id} className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${ev.eventType === "cancelamento" ? "bg-red-500" : ev.eventType === "encerramento" ? "bg-indigo-500" : "bg-emerald-500"}`} />
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{EVENT_LABELS[ev.eventType] || ev.eventType}</p>
                    <span className="text-xs text-slate-400">{timeAgo(ev.createdAt)}</span>
                  </div>
                  {ev.protocol && <p className="text-xs font-mono text-slate-500 mt-1">Protocolo: {ev.protocol}</p>}
                  {ev.reason && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ev.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Ambiente de homologação simulada. Emissão real requer certificado A1/A3 e integração SEFAZ.
      </p>
    </div>
  );
}
