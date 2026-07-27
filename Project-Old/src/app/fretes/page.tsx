import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import FreightCard from "@/components/FreightCard";
import { UFS, VEHICLE_TYPES, BODY_TYPES } from "@/lib/constants";
import { safeQuery } from "@/lib/db-query";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

const PER_PAGE = 20;

export default async function FretesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const originState = param(sp.originState);
  const originCity = param(sp.originCity);
  const destState = param(sp.destState);
  const destCity = param(sp.destCity);
  const vehicle = param(sp.vehicle);
  const body = param(sp.body);
  const q = param(sp.q);
  const page = Math.max(1, parseInt(param(sp.page) || "1", 10));

  const { data: rows, error: dbError } = await safeQuery(async () => {
    const conditions: SQL[] = [eq(freights.status, "ativo")];
    if (originState) conditions.push(eq(freights.originState, originState));
    if (originCity) conditions.push(ilike(freights.originCity, `%${originCity}%`));
    if (destState) conditions.push(eq(freights.destState, destState));
    if (destCity) conditions.push(ilike(freights.destCity, `%${destCity}%`));
    if (vehicle) conditions.push(ilike(freights.vehicleTypes, `%${vehicle}%`));
    if (body) conditions.push(ilike(freights.bodyTypes, `%${body}%`));
    if (q) {
      const c = or(ilike(freights.cargoType, `%${q}%`), ilike(freights.originCity, `%${q}%`), ilike(freights.destCity, `%${q}%`));
      if (c) conditions.push(c);
    }
    return db
      .select({ freight: freights, ownerName: users.name, ownerCompany: users.company })
      .from(freights)
      .innerJoin(users, eq(freights.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(freights.featured), desc(freights.createdAt))
      .limit(PER_PAGE + 1)
      .offset((page - 1) * PER_PAGE);
  });

  const resultRows = rows ?? [];
  const hasNext = resultRows.length > PER_PAGE;
  if (hasNext) resultRows.pop();

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white";
  const labelCls = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Buscar fretes</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        {resultRows.length} {resultRows.length === 1 ? "frete encontrado" : "fretes encontrados"}
      </p>

      {dbError && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
          ⚠️ Não foi possível conectar ao banco de dados agora. Se você está configurando o Vercel pela primeira vez, verifique se a variável <code className="font-bold">DATABASE_URL</code> está correta nas <strong>Environment Variables</strong>.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <form method="GET" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 lg:sticky lg:top-20">
          <p className="font-bold text-slate-900 dark:text-white">Filtros</p>
          <div><label className={labelCls}>Busca livre</label><input name="q" defaultValue={q} placeholder="Carga, cidade..." className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Origem UF</label><select name="originState" defaultValue={originState} className={inputCls}><option value="">Todas</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
            <div><label className={labelCls}>Destino UF</label><select name="destState" defaultValue={destState} className={inputCls}><option value="">Todas</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
          </div>
          <div><label className={labelCls}>Cidade origem</label><input name="originCity" defaultValue={originCity} placeholder="Ex: Sorriso" className={inputCls} /></div>
          <div><label className={labelCls}>Cidade destino</label><input name="destCity" defaultValue={destCity} placeholder="Ex: Santos" className={inputCls} /></div>
          <div><label className={labelCls}>Tipo de caminhão</label><select name="vehicle" defaultValue={vehicle} className={inputCls}><option value="">Todos</option>{VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className={labelCls}>Carroceria</label><select name="body" defaultValue={body} className={inputCls}><option value="">Todas</option>{BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}</select></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">Filtrar</button>
            <a href="/fretes" className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Limpar</a>
          </div>
        </form>

        <div>
          {resultRows.length === 0 && !dbError ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <p className="text-5xl">🛣️</p>
              <p className="mt-4 font-bold text-slate-900 dark:text-white text-lg">Nenhum frete encontrado</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">Tente ajustar os filtros ou volte mais tarde.</p>
            </div>
          ) : dbError ? null : (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {resultRows.map((row) => (
                  <FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                {page > 1 && (
                  <a href={`/fretes?${new URLSearchParams({ ...(originState && { originState }), ...(destState && { destState }), ...(originCity && { originCity }), ...(destCity && { destCity }), ...(vehicle && { vehicle }), ...(body && { body }), ...(q && { q }), page: String(page - 1) }).toString()}`}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">&larr; Anterior</a>
                )}
                <span className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">Página {page}</span>
                {hasNext && (
                  <a href={`/fretes?${new URLSearchParams({ ...(originState && { originState }), ...(destState && { destState }), ...(originCity && { originCity }), ...(destCity && { destCity }), ...(vehicle && { vehicle }), ...(body && { body }), ...(q && { q }), page: String(page + 1) }).toString()}`}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Próxima &rarr;</a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
