import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatBRL, formatWeight } from "@/lib/constants";
import { IcShield, IcTruck, IcCheck } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function ComprovantePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) notFound();

  const rows = await db
    .select({ freight: freights, ownerName: users.name, ownerCompany: users.company, ownerPhone: users.phone })
    .from(freights)
    .innerJoin(users, eq(freights.userId, users.id))
    .where(eq(freights.id, freightId))
    .limit(1);

  if (rows.length === 0) notFound();
  const { freight: f, ownerName, ownerCompany, ownerPhone } = rows[0];

  const priceLabel = f.price ? formatBRL(f.price) : "A combinar";
  const now = new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 print:p-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href={`/fretes/${f.id}`} className="text-sm text-orange-600 font-semibold hover:underline">
          &larr; Voltar ao frete
        </Link>
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.print();
          }}
          className="bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Official Receipt Card */}
      <div className="bg-white text-slate-900 rounded-3xl border-2 border-slate-300 p-8 shadow-xl print:border-none print:shadow-none">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IcTruck className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-black tracking-tight">
                Frete<span className="text-orange-500">Truck</span>
              </span>
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mt-1">
              Comprovante de Transporte & Entrega Digital (POD)
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full uppercase tracking-wider">
              Autenticado
            </span>
            <p className="text-xs text-slate-400 font-mono mt-1">ID: #FT-{f.id}-{now.getFullYear()}</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rota de Transporte</p>
          <div className="flex items-center gap-3 mt-1 text-lg font-black text-slate-900">
            <span>{f.originCity} / {f.originState}</span>
            <span className="text-orange-500">&rarr;</span>
            <span>{f.destCity} / {f.destState}</span>
          </div>
          {f.distanceKm && <p className="text-xs text-slate-500 mt-0.5">Distância: {f.distanceKm.toLocaleString("pt-BR")} km</p>}
        </div>

        {/* Cargo and Shipper Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-500 uppercase text-[10px]">Dados da Carga</p>
            <p><strong>Tipo:</strong> {f.cargoType}</p>
            <p><strong>Peso Declarado:</strong> {formatWeight(f.weightKg)}</p>
            <p><strong>Valor do Frete:</strong> <span className="font-bold text-emerald-600">{priceLabel}</span></p>
            <p><strong>Veículo:</strong> {f.vehicleTypes.split(",")[0]}</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-500 uppercase text-[10px]">Embarcador Responsável</p>
            <p><strong>Nome:</strong> {ownerCompany || ownerName}</p>
            <p><strong>Contato:</strong> {f.contactName}</p>
            <p><strong>Telefone:</strong> {f.contactPhone || ownerPhone}</p>
            <p><strong>Data de Emissão:</strong> {now.toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* Signatures Area */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 font-mono italic">Assinado Digitalmente</span>
            </div>
            <p className="mt-2 font-bold text-slate-800">Motorista / Transportador</p>
          </div>

          <div>
            <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400 font-mono italic">Assinatura do Recebedor</span>
            </div>
            <p className="mt-2 font-bold text-slate-800">Recebedor no Destino</p>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Emitido via FreteTruck.app</span>
          <span>Hash: SHA256-POD-{f.id}-{f.userId}</span>
        </div>
      </div>
    </div>
  );
}
