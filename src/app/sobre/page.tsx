import Link from "next/link";

export default function SobrePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <span className="text-7xl block mb-4">🚛</span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">
          Sobre o <span className="text-orange-500">FreteTruck</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
          O marketplace mais completo para fretes do Brasil.
        </p>
      </div>

      {/* Story */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Nossa história</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          O FreteTruck nasceu da frustração real de caminhoneiros e embarcadores brasileiros. Enquanto plataformas existentes cobram comissões abusivas,
          limitam informações e deixam muito a desejar em UX, nós construímos algo diferente: <strong>gratuito</strong>, moderno,
          com ferramentas inteligentes (calculadora de frete, mapa interativo, chat interno, sistema de lances) e foco total na experiência
          do motorista autônomo e do pequeno embarcador.
        </p>
        <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
          Somos 100% brasileiros, built with ❤️ para rodar em qualquer dispositivo — desktop, mobile e em breve nossos aplicativos nativos.
        </p>
      </section>

      {/* Features summary */}
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">O que nos torna diferente</h2>
      <div className="space-y-3 mb-8">
        {[
          { icon: "💰", title: "Grátis e sem comissão", desc: "Nenhuma taxa sobre o valor do frete. Nunca cobramos % do valor do frete." },
          { icon: "📨", title: "Propostas online + Chat", desc: "Negocie dentro da plataforma. Compartilhe dados de contato quando quiser." },
          { icon: "🧮", title: "Calculadora inteligente", desc: "Diga se o frete vale a pena com base diesel, pedágio, manutenção e mais." },
          { icon: "🔄", title: "Frete de retorno", desc: "Nunca volte vazio! Veja cargas saindo do destino do seu frete." },
          { icon: "⭐", title: "Reputação real", desc: "Avaliações detalhadas, badges e nível de confiança por usuário." },
          { icon: "🎰", title: "Leilões reversos", def: "Defina preço mínimo e receba propostas. Aceite a melhor oferta.", isNew: true },
          { icon: "📋", title: "Verificação de documentos", def: "CNH, RNTC, CRVL verificados — mais confiança para todos.", isNew: true },
          { icon: "📍", title: "Rastreamento em tempo real", def: "Siga a carga do embarcador até o destino com mapa visual.", isNew: true },
          { icon: "🎁", title: "Programa de afiliados", def: "Ganhe R$ 25 por amigo que se cadastrar e usar o app.", isNew: true },
          { icon: "🌙", title: "Modo escuro completo", def: "Interface adaptada para quem dirige à noite.", isNew: false },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <span className="text-3xl shrink-0">{f.icon}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
                {(f as any).isNew && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Novo!</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{(f as any).desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-3 gap-4 my-10">
        {[
          { num: "27", label: "Estados atendidos" },
          { num: "0%", label: "Comissão" },
          { num: "∞", label: "Fretes publicados" },
        ].map((n) => (
          <div key={n.label} className="text-center">
            <p className="text-4xl font-extrabold text-orange-500">{n.num}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-orange-500 rounded-2xl p-10 text-center text-white">
        <h2 className="text-2xl font-extrabold">Comece agora — é grátis!</h2>
        <p className="mt-2 opacity-90">Junte-se a milhares de motoristas e embarcadores.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/cadastro" className="bg-white text-orange-500 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors">
            Criar conta grátis
          </Link>
          <Link href="/ajuda" className="border border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
            Precisa de ajuda?
          </Link>
        </div>
      </div>
    </div>
  );
}
