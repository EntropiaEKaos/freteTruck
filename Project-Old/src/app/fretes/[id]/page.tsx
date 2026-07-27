import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { formatBRL, formatWeight, timeAgo } from "@/lib/constants";
import FreightActions from "@/components/FreightActions";
import FreightCard from "@/components/FreightCard";
import ShareButton from "@/components/ShareButton";
import FreightQRCode from "@/components/FreightQRCode";
import { calculateANTTFloor, detectCargoCategory } from "@/lib/antt";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const fid = parseInt(id, 10);
  if (Number.isNaN(fid)) return { title: "Frete não encontrado — FreteTruck" };
  try {
    const rows = await db.select().from(freights).where(eq(freights.id, fid)).limit(1);
    const f = rows[0];
    if (!f) return { title: "Frete não encontrado — FreteTruck" };
    const price = f.price ? formatBRL(f.price) : "A combinar";
    const title = `Frete ${f.originCity}/${f.originState} → ${f.destCity}/${f.destState} — ${price}`;
    const description = `${f.cargoType} · ${formatWeight(f.weightKg)} · ${f.distanceKm ? f.distanceKm + " km" : ""} · Veículos: ${f.vehicleTypes}`;
    return { title: `${title} | FreteTruck`, description, openGraph: { title, description, type: "website" } };
  } catch {
    return { title: "Frete não encontrado — FreteTruck" };
  }
}

export default async function FreightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) notFound();

  try {
    await db.update(freights).set({ views: sql`${freights.views} + 1` }).where(eq(freights.id, freightId));
  } catch { /* views increment is non-critical */ }

  let f: any = null, ownerName: string = "", ownerCompany: string = "", returnFreights: any[] = [], similarFreights: any[] = [];

  try {
    const rows = await db
      .select({ freight: freights, ownerName: users.name, ownerCompany: users.company, ownerRole: users.role })
      .from(freights)
      .innerJoin(users, eq(freights.userId, users.id))
      .where(eq(freights.id, freightId))
      .limit(1);
    if (rows.length === 0) notFound();
    f = rows[0].freight;
    ownerName = rows[0].ownerName;
    ownerCompany = rows[0].ownerCompany ?? "";
  } catch (e) {
    console.error("Error loading freight:", e);
    return <FallbackError />;
  }

  try {
    [returnFreights, similarFreights] = await Promise.all([
      db.select({ freight: freights, ownerName: users.name, ownerCompany: users.company }).from(freights).innerJoin(users, eq(freights.userId, users.id))
        .where(and(eq(freights.status, "ativo"), eq(freights.originState, f.destState), ne(freights.id, f.id))).orderBy(desc(freights.createdAt)).limit(3),
      db.select({ freight: freights, ownerName: users.name, ownerCompany: users.company }).from(freights).innerJoin(users, eq(freights.userId, users.id))
        .where(and(eq(freights.status, "ativo"), eq(freights.cargoType, f.cargoType), ne(freights.id, f.id))).orderBy(desc(freights.createdAt)).limit(3),
    ]);
  } catch {}

  const priceLabel = f.priceType === "combinar" || !f.price ? "A combinar" : f.priceType === "tonelada" ? `${formatBRL(f.price)} por tonelada` : formatBRL(f.price);
  const perKm = f.price && f.distanceKm && f.priceType === "total" ? (parseFloat(f.price) / f.distanceKm) : null;
  const phone = f.contactPhone.startsWith("55") ? f.contactPhone : `55${f.contactPhone}`;
  const waText = encodeURIComponent(`Olá! Vi seu frete no FreteTruck: ${f.cargoType} de ${f.originCity}/${f.originState} para ${f.destCity}/${f.destState}. Ainda está disponível?`);
  const waLink = `https://wa.me/${phone}?text=${waText}`;
  const routeTitle = `${f.originCity}/${f.originState} → ${f.destCity}/${f.destState}`;
  const antt = f.distanceKm ? calculateANTTFloor(f.distanceKm, 6, detectCargoCategory(f.cargoType)) : null;
  const numericPrice = f.price ? parseFloat(f.price) : 0;
  const isAbove = antt && numericPrice > 0 ? numericPrice >= antt.minPrice : null;

  const infoRow = (label: string, value: string) => (
    <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-white text-right">{value}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href="/fretes" className="text-sm text-orange-600 font-semibold hover:underline">← Voltar para a busca</Link>
        <div className="flex items-center gap-2 flex-wrap">
          {isAbove !== null && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isAbove ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {isAbove ? "✓ Acima do piso ANTT" : "⚠ Abaixo do piso ANTT"}
            </span>
          )}
          <FreightQRCode freightId={f.id} title={routeTitle} price={priceLabel} />
          <Link href={`/comprovante/${f.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Comprovante POD</Link>
          <ShareButton freightId={f.id} title={routeTitle} />
        </div>
      </div>

      <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-900 dark:bg-black text-white p-6 md:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-orange-400 font-semibold">Frete #{f.id} · {timeAgo(f.createdAt)} · {f.views} visualizações</p>
              <h1 className="mt-2 text-2xl md:text-3xl font-extrabold flex items-center gap-3 flex-wrap">
                <span>{f.originCity}/{f.originState}</span><span className="text-orange-500">→</span><span>{f.destCity}/{f.destState}</span>
              </h1>
              <p className="mt-1 text-slate-300">{f.cargoType}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Valor do frete</p>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-400">{priceLabel}</p>
              {perKm && <p className="text-sm text-slate-300 mt-0.5">R$ {perKm.toFixed(2)}/km</p>}
              {f.toll && <p className="text-xs text-slate-300 mt-1">✓ Pedágio incluso</p>}
            </div>
          </div>
          {f.status === "fechado" && <div className="mt-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg px-4 py-2 text-sm font-semibold">⚠️ Este frete já foi fechado.</div>}
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-2">Detalhes da carga</h2>
            {infoRow("Tipo de carga", f.cargoType)}
            {infoRow("Peso", formatWeight(f.weightKg))}
            {f.distanceKm ? infoRow("Distância", `${f.distanceKm.toLocaleString("pt-BR")} km`) : null}
            {f.loadDate ? infoRow("Data de carregamento", f.loadDate) : null}
            {infoRow("Rastreador", f.needsTracker ? "Obrigatório" : "Não exigido")}
            {infoRow("Lona", f.needsTarp ? "Obrigatória" : "Não exigida")}
            {f.description && <><h2 className="font-bold text-slate-900 dark:text-white mt-6 mb-2">Observações</h2><p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{f.description}</p></>}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-2">Veículos aceitos</h2>
            <div className="flex flex-wrap gap-2">{f.vehicleTypes.split(",").map((v: string) => (<span key={v} className="text-sm bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700 px-3 py-1 rounded-full font-medium">{v}</span>))}</div>
            <h2 className="font-bold text-slate-900 dark:text-white mt-5 mb-2">Carrocerias aceitas</h2>
            <div className="flex flex-wrap gap-2">{f.bodyTypes.split(",").map((b: string) => (<span key={b} className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-full font-medium">{b}</span>))}</div>
            <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Publicado por</p>
              <Link href={`/perfil/${f.userId}`} className="mt-1 font-bold text-slate-900 dark:text-white hover:text-orange-600 transition-colors">{ownerCompany || ownerName}</Link>
              <p className="text-sm text-slate-500 dark:text-slate-400">Contato: {f.contactName}</p>
              {f.status === "ativo" ? (
                <div className="mt-4 space-y-2">
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors">💬 Negociar pelo WhatsApp</a>
                  <a href={`/chat?with=${f.userId}`} className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">✉️ Chat interno</a>
                </div>
              ) : <div className="mt-4 text-center text-sm text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-3">Contato indisponível</div>}
              <p className="mt-2 text-center text-xs text-slate-400"><Link href={`/perfil/${f.userId}`} className="text-orange-600 hover:underline">Ver perfil e avaliações →</Link></p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6"><FreightActions freightId={f.id} ownerId={f.userId} ownerName={ownerName} freightStatus={f.status} /></div>

      {similarFreights.length > 0 && (
        <div className="mt-10"><h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Fretes similares ({f.cargoType})</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">{similarFreights.map((row: any) => (<FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} />))}</div>
        </div>
      )}

      {returnFreights.length > 0 && (
        <div className="mt-10"><h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Não volte vazio! Fretes saindo de {f.destState}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cargas disponíveis para o seu retorno após a entrega.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">{returnFreights.map((row: any) => (<FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} />))}</div>
        </div>
      )}
    </div>
  );
}

function FallbackError() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Frete não encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">O frete que você está procurando pode ter sido removido ou o banco de dados está temporariamente indisponível.</p>
        <Link href="/fretes" className="mt-6 inline-block text-orange-600 font-semibold hover:underline">Voltar para a busca</Link>
      </div>
    </div>
  );
}
