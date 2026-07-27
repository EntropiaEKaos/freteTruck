"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Freight, FiscalDocument } from "@/db/schema";
import { formatBRL, timeAgo } from "@/lib/constants";
import { IcDoc, IcShield, IcCheck, IcX, IcTruck } from "@/components/Icons";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

type FiscalRow = { document: FiscalDocument; freight: Freight };
type FreightRow = { freight: Freight; ownerName: string; ownerCompany: string | null };

export default function FiscalPage() {
  const [docs, setDocs] = useState<FiscalRow[]>([]);
  const [freights, setFreights] = useState<FreightRow[]>([]);
  const [selectedFreight, setSelectedFreight] = useState("");
  const [docType, setDocType] = useState<"cte" | "mdfe">("cte");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [docsRes, freightsRes] = await Promise.all([
      fetch("/api/fiscal").then((r) => r.json()),
      fetch("/api/freights?mine=1").then((r) => r.json()),
    ]);
    setDocs(docsRes.documents || []);
    setFreights(freightsRes.freights || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createDoc() {
    if (!selectedFreight) { toast.error("Selecione um frete."); return; }
    setError("");
    setCreating(true);
    
    // Animação de scanner falso
    const loadingToast = toast.loading("Gerando XML e calculando impostos...");
    
    const res = await fetch("/api/fiscal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freightId: selectedFreight, docType }),
    });
    const data = await res.json();
    
    toast.dismiss(loadingToast);
    
    if (!res.ok) {
      toast.error(data.error || "Erro ao criar documento.");
    } else {
      toast.success("Rascunho fiscal gerado com sucesso!");
      setSelectedFreight("");
      await load();
    }
    setCreating(false);
  }

  async function action(id: number, actionName: "emitir" | "cancelar") {
    setBusy(id);
    const loadingToast = toast.loading(actionName === "emitir" ? "Conectando à SEFAZ..." : "Enviando evento de cancelamento...");
    
    const res = await fetch(`/api/fiscal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionName, reason: actionName === "cancelar" ? "Cancelamento a pedido do usuário" : undefined }),
    });
    const data = await res.json();
    
    toast.dismiss(loadingToast);
    
    if (!res.ok) {
      toast.error(data.error || "Erro na operação.");
    } else {
      if (actionName === "emitir") {
        toast.success("Documento autorizado pela SEFAZ!");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#10b981", "#34d399", "#ffffff"] });
      } else {
        toast.success("Documento cancelado.");
      }
      await load();
    }
    setBusy(null);
  }

  const statusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      rascunho: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      pronto_para_emitir: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      autorizado_simulado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg[status] || cfg.rascunho}`}>{status.replaceAll("_", " ")}</span>;
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-500">Carregando módulo fiscal...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
          <IcDoc className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">CT-e / MDF-e</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Central fiscal para pré-emissão, validação e futura autorização SEFAZ.</p>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <strong>Importante:</strong> este módulo está em modo <b>homologação simulada</b>. Para emissão real é obrigatório certificado digital A1/A3, CNPJ credenciado na SEFAZ e integração com provedor fiscal ou webservice oficial.
      </div>

      {/* Create document */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Gerar rascunho fiscal</h2>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Frete</label>
            <select value={selectedFreight} onChange={(e) => setSelectedFreight(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm">
              <option value="">Selecione um frete</option>
              {freights.map(({ freight }) => (
                <option key={freight.id} value={freight.id}>
                  #{freight.id} — {freight.originCity}/{freight.originState} → {freight.destCity}/{freight.destState} — {freight.price ? formatBRL(freight.price) : "A combinar"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Documento</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as "cte" | "mdfe")} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm">
              <option value="cte">CT-e</option>
              <option value="mdfe">MDF-e</option>
            </select>
          </div>
          <button onClick={createDoc} disabled={creating} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-lg text-sm">
            {creating ? "Gerando..." : "Gerar rascunho"}
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div className="mt-8">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Documentos fiscais</h2>
        {docs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 text-sm">
            Nenhum documento fiscal criado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(({ document: d, freight }) => (
              <div key={d.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white uppercase">{d.docType}</span>
                      {statusBadge(d.status)}
                      <span className="text-xs text-slate-400">{timeAgo(d.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Frete #{freight.id}: {freight.originCity}/{freight.originState} → {freight.destCity}/{freight.destState}
                    </p>
                    {d.accessKey && <p className="mt-1 text-xs font-mono text-slate-400 break-all">Chave: {d.accessKey}</p>}
                    {d.protocol && <p className="mt-1 text-xs font-mono text-emerald-600">Protocolo: {d.protocol}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={`/api/fiscal/${d.id}`} className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                      Baixar XML
                    </a>
                    {d.status === "pronto_para_emitir" && (
                      <button onClick={() => action(d.id, "emitir")} disabled={busy === d.id} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">
                        Simular autorização
                      </button>
                    )}
                    {d.status === "autorizado_simulado" && (
                      <button onClick={() => action(d.id, "cancelar")} disabled={busy === d.id} className="text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                        Cancelar
                      </button>
                    )}
                    <Link href={`/fretes/${freight.id}`} className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800">
                      Ver frete
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration roadmap */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <IcShield className="w-6 h-6" />, title: "Certificado A1/A3", desc: "Obrigatório para assinar XML com validade jurídica." },
          { icon: <IcTruck className="w-6 h-6" />, title: "SEFAZ / Provedor", desc: "Transmitir para SEFAZ via webservice ou API fiscal homologada." },
          { icon: <IcCheck className="w-6 h-6" />, title: "DACTE / DAMDFE", desc: "Gerar PDF auxiliar após autorização de uso." },
        ].map((item) => (
          <div key={item.title} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="text-orange-500 mb-3">{item.icon}</div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
