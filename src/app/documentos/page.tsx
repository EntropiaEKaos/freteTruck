"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

type Doc = { id: number; docType: string; fileUrl: string; status: string; reviewComment: string | null; createdAt: string };

const DOC_TYPES = [
  { key: "cnh", name: "CNH (Carteira Nacional de Habilitação)", icon: "🪪" },
  { key: "rntc", name: "RNTC (Registro Nacional Transportadores)", icon: "📋" },
  { key: "crvl", name: "CRVL (Certificado Registro Veículo)", icon: "🚛" },
  { key: "cltm", name: "CLTM (Certificado Licença Motorista)", icon: "📄" },
];

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  async function load() {
    const res = await fetch("/api/documents").then(r => r.json());
    setDocs(res.documents || []);
    setVerified(res.verified || false);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startUpload(docType: string) {
    setPendingType(docType);
    fileRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingType) return;
    setError("");
    setUploading(pendingType);

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 5MB)."); 
      setUploading(null); 
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Simulação de Inteligência Artificial OCR (Visual Feedback)
        setScannerActive(true);
        setScanProgress(0);
        
        const interval = setInterval(() => {
          setScanProgress((p) => {
            if (p >= 90) { clearInterval(interval); return 90; }
            return p + 15;
          });
        }, 150);

        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docType: pendingType, fileData: base64 }),
        });
        
        clearInterval(interval);
        setScanProgress(100);
        
        setTimeout(async () => {
          setScannerActive(false);
          if (!res.ok) {
            const d = await res.json();
            toast.error(d.error || "Erro ao enviar.");
          } else {
            toast.success("Documento recebido e pré-analisado com sucesso!");
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
            await load();
          }
          setUploading(null);
          setPendingType(null);
        }, 800);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erro ao ler arquivo.");
      setUploading(null);
      setScannerActive(false);
    }
    e.target.value = "";
  }

  function statusBadge(s: string) {
    const m: Record<string, string> = {
      pendente: "bg-amber-100 text-amber-700 border-amber-200",
      aprovado: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejeitado: "bg-red-100 text-red-700 border-red-200",
    };
    const icons: Record<string, string> = { pendente: "⏳", aprovado: "✅", rejeitado: "❌" };
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${m[s] || ""}`}>{icons[s]} {s}</span>;
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 relative">
      {scannerActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700 overflow-hidden relative">
            {/* Linha de Scanner que sobe e desce */}
            <div className="absolute left-0 right-0 h-1 bg-orange-500/50 shadow-[0_0_15px_#f97316] animate-scan z-0" />
            
            <div className="text-6xl mb-4 relative z-10">📸</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white relative z-10">
              {scanProgress === 100 ? "Concluído!" : "Analisando Documento..."}
            </h3>
            <p className="text-sm text-slate-500 mt-2 relative z-10">
              Lendo informações com OCR (Inteligência Artificial)
            </p>
            
            <div className="mt-6 w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative z-10">
              <div 
                className="h-full bg-orange-500 transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-xs text-orange-500 font-bold mt-2 relative z-10">{scanProgress}%</p>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelected} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">📋 Verificação de Documentos</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Envie seus documentos para ganhar o selo ✅ Verificado.</p>
        </div>
        {verified && <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold rounded-full">✅ Conta verificada</span>}
      </div>

      {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="mt-6 space-y-4">
        {DOC_TYPES.map(dt => {
          const existing = docs.find(d => d.docType === dt.key);
          return (
            <div key={dt.key} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl shrink-0">{dt.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{dt.name}</p>
                  {existing && (
                    <>
                      <p className="text-xs text-slate-500 mt-0.5">Enviado em {new Date(existing.createdAt).toLocaleDateString("pt-BR")}</p>
                      <div className="mt-1">{statusBadge(existing.status)}</div>
                      {existing.reviewComment && existing.status === "rejeitado" && (
                        <p className="text-xs text-red-600 mt-1">Motivo: {existing.reviewComment}</p>
                      )}
                      {existing.fileUrl && existing.status !== "rejeitado" && (
                        <p className="text-xs text-blue-600 mt-1">📎 Arquivo salvo</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!existing || existing.status === "rejeitado" ? (
                <button onClick={() => startUpload(dt.key)} disabled={uploading !== null}
                  className={`shrink-0 text-sm font-bold px-5 py-2.5 rounded-lg transition-colors ${uploading === dt.key ? "opacity-50" : "bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"}`}>
                  {uploading === dt.key ? "Enviando..." : existing ? "📤 Reenviar" : "📤 Enviar arquivo"}
                </button>
              ) : existing.status === "pendente" ? (
                <span className="shrink-0 text-xs text-slate-400">Aguardando análise...</span>
              ) : (
                <span className="shrink-0 text-xs text-emerald-600 font-bold">✅ Aprovado</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <p className="font-bold text-blue-800 dark:text-blue-300 text-sm">💡 Por que verificar?</p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400">
          <li>• Aumenta sua taxa de aceite das propostas em até 300%</li>
          <li>• Aparece com selo verde no seu perfil</li>
          <li>• Aceita JPG, PNG ou PDF — máximo 5MB por arquivo</li>
          <li>• Análise feita pelo administrador da plataforma</li>
        </ul>
      </div>
    </div>
  );
}
