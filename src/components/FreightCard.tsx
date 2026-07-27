import Link from "next/link";
import type { Freight } from "@/db/schema";
import type { OpportunityScore } from "@/lib/freight-score";
import { formatBRL, formatWeight, timeAgo } from "@/lib/constants";
import { IcEye, IcWeight, IcPin, IcRadar, IcStar, IcCheck } from "./Icons";

export default function FreightCard({
  freight,
  ownerName,
  ownerCompany,
  ownerVerified,
  opportunity,
}: {
  freight: Freight;
  ownerName: string;
  ownerCompany: string | null;
  ownerVerified?: boolean;
  opportunity?: OpportunityScore;
}) {
  const vehicles = freight.vehicleTypes.split(",").slice(0, 3);
  const priceLabel =
    freight.priceType === "combinar" || !freight.price
      ? "A combinar"
      : freight.priceType === "tonelada"
        ? `${formatBRL(freight.price)}/ton`
        : formatBRL(freight.price);

  const perKm = freight.price && freight.distanceKm && freight.priceType === "total"
    ? (parseFloat(freight.price) / freight.distanceKm) : null;
  const quality = perKm ? (perKm >= 7 ? "text-emerald-600" : perKm >= 5 ? "text-amber-600" : "text-red-500") : "";

  return (
    <Link
      href={`/fretes/${freight.id}`}
      className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all p-5"
    >
      {/* Opportunity score */}
      {opportunity && (
        <div className="flex items-center justify-between gap-2 mb-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Score de oportunidade</p>
            <p className={`text-xs font-bold ${opportunity.score >= 82 ? "text-emerald-600" : opportunity.score >= 68 ? "text-blue-600" : opportunity.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
              {opportunity.label}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black border-4 ${opportunity.score >= 82 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : opportunity.score >= 68 ? "bg-blue-50 text-blue-700 border-blue-200" : opportunity.score >= 50 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {opportunity.score}
          </div>
        </div>
      )}

      {/* Featured badge */}
      {freight.featured && (
        <div className="flex items-center gap-1 mb-2">
          <IcStar className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Destacado</span>
        </div>
      )}

      {/* Auction badge */}
      {freight.isAuction && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded">Leilão aberto</span>
        </div>
      )}
      {freight.isRecurring && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">Recorrente · {freight.recurringFrequency || "periódico"}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="truncate">{freight.originCity}/{freight.originState}</span>
            <span className="text-orange-500 shrink-0">&rarr;</span>
            <span className="truncate">{freight.destCity}/{freight.destState}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{freight.cargoType}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{priceLabel}</p>
          {perKm && (
            <p className={`text-xs font-medium ${quality}`}>
              R$ {perKm.toFixed(2)}/km
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(freight.createdAt)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
          <IcWeight className="w-3 h-3" /> {formatWeight(freight.weightKg)}
        </span>
        {freight.distanceKm ? (
          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
            <IcPin className="w-3 h-3" /> {freight.distanceKm.toLocaleString("pt-BR")} km
          </span>
        ) : null}
        {vehicles.map((v) => (
          <span key={v} className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded font-medium">
            {v}
          </span>
        ))}
        {freight.needsTracker && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
            <IcRadar className="w-3 h-3" /> Rastreador
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate inline-flex items-center gap-1">
          {ownerCompany || ownerName}
          {ownerVerified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full" title="Conta verificada">
              <IcCheck className="w-3 h-3" /> Verificado
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1"><IcEye className="w-3 h-3" /> {freight.views}</span>
      </div>
    </Link>
  );
}
