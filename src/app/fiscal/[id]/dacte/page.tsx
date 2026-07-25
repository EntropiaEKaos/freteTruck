import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { fiscalDocuments, freights, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatBRL, formatWeight } from "@/lib/constants";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function DactePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docId = parseInt(id, 10);
  if (Number.isNaN(docId)) notFound();

  const rows = await db
    .select({ doc: fiscalDocuments, freight: freights, ownerName: users.name, ownerCompany: users.company })
    .from(fiscalDocuments)
    .innerJoin(freights, eq(fiscalDocuments.freightId, freights.id))
    .innerJoin(users, eq(fiscalDocuments.userId, users.id))
    .where(eq(fiscalDocuments.id, docId))
    .limit(1);

  if (rows.length === 0) notFound();
  const { doc, freight: f, ownerName, ownerCompany } = rows[0];
  const isCte = doc.docType === "cte";
  const title = isCte ? "DACTE" : "DAMDFE";
  const subtitle = isCte ? "Documento Auxiliar do Conhecimento de Transporte Eletrônico" : "Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 print:p-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href={`/fiscal/${doc.id}`} className="text-sm text-orange-600 font-semibold hover:underline">← Voltar</Link>
        <PrintButton />
      </div>

      <div className="bg-white text-slate-900 rounded-3xl border-2 border-slate-300 p-8 shadow-xl print:border-none print:shadow-none">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <p className="text-2xl font-black">{title}</p>
            <p className="text-[10px] text-slate-500 max-w-xs leading-tight mt-1">{subtitle}</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black tracking-tight">Frete<span className="text-orange-500">Truck</span></span>
            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Modelo {isCte ? "57" : "58"} · Série 001</p>
          </div>
        </div>

        {/* Barcode-like access key */}
        <div className="my-4 p-3 border border-slate-300 rounded-lg text-center">
          <p className="text-[9px] uppercase font-bold text-slate-400">Chave de acesso</p>
          <p className="font-mono text-[11px] tracking-tight break-all mt-1">{doc.accessKey || "—"}</p>
          <div className="mt-2 flex justify-center gap-[1px]">
            {(doc.accessKey || "0".repeat(44)).split("").map((c, i) => (
              <span key={i} style={{ width: (Number(c) % 3) + 1 + "px", height: "28px" }} className="bg-slate-900 inline-block" />
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 border border-slate-200 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-slate-400">Situação</p>
            <p className="font-bold mt-0.5">
              {doc.status === "autorizado_simulado" ? "Autorizado (homologação)" :
               doc.status === "encerrado_simulado" ? "Encerrado" :
               doc.status === "cancelado" ? "Cancelado" : "Pendente"}
            </p>
            {doc.protocol && <p className="text-[10px] text-slate-500 mt-0.5">Prot.: {doc.protocol}</p>}
          </div>
          <div className="p-3 border border-slate-200 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-slate-400">Emissão</p>
            <p className="font-bold mt-0.5">{doc.issuedAt ? new Date(doc.issuedAt).toLocaleString("pt-BR") : new Date(doc.createdAt).toLocaleString("pt-BR")}</p>
          </div>
        </div>

        {/* Emitente */}
        <div className="mt-4 p-3 border border-slate-200 rounded-lg text-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400">Emitente / Transportador</p>
          <p className="font-bold mt-0.5">{ownerCompany || ownerName}</p>
        </div>

        {/* Route + cargo */}
        <div className="mt-4 p-3 border border-slate-200 rounded-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400">Prestação de serviço de transporte</p>
          <div className="flex items-center gap-2 mt-1 font-black text-slate-900">
            <span>{f.originCity}/{f.originState}</span>
            <span className="text-orange-500">→</span>
            <span>{f.destCity}/{f.destState}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div><p className="text-[10px] text-slate-400">Carga</p><p className="font-semibold">{f.cargoType}</p></div>
            <div><p className="text-[10px] text-slate-400">Peso</p><p className="font-semibold">{formatWeight(f.weightKg)}</p></div>
            <div><p className="text-[10px] text-slate-400">Distância</p><p className="font-semibold">{f.distanceKm ? f.distanceKm + " km" : "—"}</p></div>
          </div>
        </div>

        {/* Values (CT-e only) */}
        {isCte && (
          <div className="mt-4 p-3 border border-slate-200 rounded-lg flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold text-slate-400">Valor total da prestação</p>
            <p className="text-xl font-black text-emerald-600">{f.price ? formatBRL(f.price) : "A combinar"}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Gerado por FreteTruck · Homologação simulada</span>
          <span>{title}-{doc.id}</span>
        </div>
      </div>
    </div>
  );
}


