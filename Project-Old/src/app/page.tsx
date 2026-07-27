import Link from "next/link";
import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import FreightCard from "@/components/FreightCard";
import { UFS } from "@/lib/constants";
import { IcUser, IcSearch, IcMsg, IcCheck, IcMap, IcChart, IcCalc, IcRefresh, IcStar, IcBell, IcTruck, IcTarget } from "@/components/Icons";
import HeroCarousel from "@/components/HeroCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let latest: any[] = [];
  let freightCount = 0;
  let userCount = 0;
  let dbError = false;

  try {
    const results = await Promise.all([
      db.select({ freight: freights, ownerName: users.name, ownerCompany: users.company })
        .from(freights).innerJoin(users, eq(freights.userId, users.id))
        .where(eq(freights.status, "ativo")).orderBy(desc(freights.createdAt)).limit(6),
      db.select({ c: count() }).from(freights).where(eq(freights.status, "ativo")),
      db.select({ c: count() }).from(users),
    ]);
    latest = results[0];
    freightCount = results[1][0]?.c || 0;
    userCount = results[2][0]?.c || 0;
  } catch (e) {
    console.error("[HOME] DB Error:", e);
    dbError = true;
  }

  return (
    <div>
      <HeroCarousel freightCount={freightCount || 0} userCount={userCount || 0} />

      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Últimos fretes publicados</h2>
          <Link href="/fretes" className="text-orange-600 font-semibold text-sm hover:underline">Ver todos →</Link>
        </div>
        {dbError ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-8 text-center">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold mb-2">Não foi possível conectar ao banco de dados.</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
              Verifique no Vercel: Settings → Environment Variables → <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">DATABASE_URL</code> deve ter <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono">?sslmode=require</code> no final.<br/>
              Acesse <a href="/api/health" className="underline font-bold" target="_blank">/api/health</a> para ver o erro exato.
            </p>
            <Link href="/fretes" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl">Ver fretes →</Link>
          </div>
        ) : latest.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Nenhum frete publicado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((row) => (
              <FreightCard key={row.freight.id} freight={row.freight} ownerName={row.ownerName} ownerCompany={row.ownerCompany} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white">Como funciona</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { ic: <IcUser className="w-8 h-8" />, title: "1. Cadastre-se grátis", desc: "Crie sua conta como motorista ou embarcador em menos de 1 minuto." },
              { ic: <IcSearch className="w-8 h-8" />, title: "2. Encontre ou publique", desc: "Motoristas buscam cargas com filtros. Embarcadores publicam fretes." },
              { ic: <IcTarget className="w-8 h-8" />, title: "3. Envie propostas", desc: "Propostas online com valor e mensagem." },
              { ic: <IcCheck className="w-8 h-8" />, title: "4. Negocie direto", desc: "Fale pelo chat ou WhatsApp. Sem intermediários." },
            ].map((s) => (
              <div key={s.title} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 mx-auto">{s.ic}</div>
                <h3 className="mt-4 font-bold text-lg text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white">Ferramentas exclusivas</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { ic: <IcTarget className="w-6 h-6" />, title: "Propostas online", desc: "Lances direto na plataforma.", href: "/fretes" },
            { ic: <IcMsg className="w-6 h-6" />, title: "Chat interno", desc: "Converse sem sair do app.", href: "/chat" },
            { ic: <IcMap className="w-6 h-6" />, title: "Mapa de fretes", desc: "Visualize cargas por estado.", href: "/mapa" },
            { ic: <IcChart className="w-6 h-6" />, title: "Tabela de preços", desc: "Compare R$/km.", href: "/precos" },
            { ic: <IcCalc className="w-6 h-6" />, title: "Calculadora", desc: "Lucro real da viagem.", href: "/calculadora" },
            { ic: <IcRefresh className="w-6 h-6" />, title: "Frete de retorno", desc: "Nunca volte vazio.", href: "/fretes" },
            { ic: <IcStar className="w-6 h-6" />, title: "Reputação", desc: "Avaliações e badges.", href: "/fretes" },
            { ic: <IcBell className="w-6 h-6" />, title: "Notificações", desc: "Alertas em tempo real.", href: "/painel" },
          ].map((f) => (
            <Link key={f.title} href={f.href} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:border-orange-400 hover:shadow-lg transition-all">
              <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">{f.ic}</div>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="bg-slate-900 dark:bg-black rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">Tem carga para transportar?</h2>
          <p className="mt-3 text-slate-300 max-w-lg mx-auto">Publique seu frete gratuitamente e receba propostas.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/publicar" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">Publicar frete grátis</Link>
            <Link href="/calculadora" className="inline-block bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl border border-white/20 transition-colors">Calcular frete</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
