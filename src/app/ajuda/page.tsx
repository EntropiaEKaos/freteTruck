import Link from "next/link";

const FAQS = [
  { q: "O FreteTruck é gratuito?", a: "Sim! Para motoristas e embarcadores é totalmente grátis buscar fretes, publicar cargas, enviar propostas e usar o chat interno. Recursos premium como destaque na busca usam créditos que você ganha com convites ou compra separadamente." },
  { q: "Como funcionam as propostas?", a: "Motoristas enviam propostas online em cada frete com valor e mensagem. O embarcador recebe e pode aceitar ou recusar. Ao aceitar, o frete fecha automaticamente e ambos recebem o contato pelo WhatsApp e chat." },
  { q: "Como funciona o chat?", a: "O chat permite comunicação direta entre motorista e embarcador dentro da plataforma. Mensagens são privadas e só visíveis para as duas partes do diálogo." },
  { q: "O que são os selos de verificação?", a: "A verificação de documentos (CNH, RNTC, CRVL) comproba sua identidade e habilitação. Contas verificadas ganham mais confiança e têm mais chances de terem suas propostas aceitas." },
  { q: "Como funciona o programa de convites?", a: "Cada vez que um amigo se cadastra pelo seu link e usa a plataforma ativamente, você ganha R$ 25 em créditos. Esses créditos podem ser usados para destacar seus fretes no topo da busca." },
  { q: "É seguro negociar pelo FreteTruck?", a: "Recomendamos sempre verificar o perfil e avaliações do outro lado. Use nosso chat interno antes de fechar fora da plataforma. Verifique CNH, compare valores na calculadora e evite transferências adiantadas desconhecidas." },
  { q: "Como uso a Calculadora de Frete?", a: "Na página /calculadora informe distância, valor do frete, preço do diesel, consumo do caminhão e custos auxiliares. A ferramenta calcula lucro líquido e te diz se vale a pena." },
  { q: "Preciso de conta bancária?", a: "Não! O FreteTruck facilita o contato entre motorista e embarcador. Os valores de frete são negociados diretamente entre eles, via PIX, TED ou conforme combinado." },
];

export default function AjudaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">❓ Central de Ajuda</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Tudo que precisa saber sobre o FreteTruck.</p>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: "📝", title: "Cadastrar-se", href: "/cadastro" },
          { icon: "🔍", title: "Buscar Fretes", href: "/fretes" },
          { icon: "🧮", title: "Calculadora", href: "/calculadora" },
          { icon: "💬", title: "Chat", href: "/chat" },
          { icon: "📋", title: "Documentos", href: "/documentos" },
          { icon: "🎁", title: "Convites", href: "/convite" },
          { icon: "💰", title: "Trucks", href: "/trucks" },
          { icon: "🗺️", title: "Mapa", href: "/mapa" },
        ].map((l) => (
          <Link key={l.title} href={l.href} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center hover:border-orange-400 transition-colors">
            <span className="text-2xl">{l.icon}</span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1">{l.title}</p>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-8 space-y-3">
        {FAQS.map((faq, i) => (
          <details key={i} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 dark:text-white text-sm flex items-center justify-between list-none">
              {faq.q}
              <span className="text-lg group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-10 bg-slate-900 dark:bg-black rounded-2xl p-8 text-white text-center">
        <p className="text-xl font-extrabold">Ainda tem dúvidas?</p>
        <p className="mt-2 text-slate-300 text-sm">Fale conosco pelo WhatsApp ou mande uma mensagem no chat.</p>
        <a href="https://wa.me/5500000000000?text=Olá! Tenho dúvidas sobre o FreteTruck."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          💬 Falar com suporte
        </a>
      </div>
    </div>
  );
}
