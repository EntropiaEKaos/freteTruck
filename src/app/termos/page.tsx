import Link from "next/link";

export default function TermosPage() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Termos de Uso</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Última atualização: Janeiro 2025</p>

      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <Section title="1. Aceitação dos Termos">
          <p>Ao acessar e utilizar a plataforma FreteTruck, você concorda com estes Termos de Uso. Se não concordar com algum ponto, não utilize a plataforma.</p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>O FreteTruck é uma plataforma online que conecta embarcadores (pessoas ou empresas que precisam transportar cargas) a motoristas de caminhão (autônomos ou vinculados a transportadoras). A plataforma funciona como intermediária na divulgação de fretes, sem participar da negociação financeira ou da execução do transporte.</p>
        </Section>

        <Section title="3. Cadastro e Conta">
          <p>Para utilizar os serviços, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</p>
          <p>O FreteTruck se reserva o direito de suspender ou encerrar contas que violem estes termos, forneçam informações falsas, ou utilizem a plataforma de forma abusiva.</p>
        </Section>

        <Section title="4. Responsabilidades do Usuário">
          <p>O usuário se compromete a: fornecer informações verdadeiras e atualizadas sobre fretes e veículos; cumprir com os acordos firmados através da plataforma; não utilizar a plataforma para atividades ilícitas; não publicar conteúdo ofensivo, discriminatório ou ilegal no mural comunitário; manter seus documentos de habilitação e veículo em dia.</p>
        </Section>

        <Section title="5. Isenção de Responsabilidade">
          <p>O FreteTruck atua exclusivamente como plataforma de divulgação e conexão. Não somos responsáveis por: a qualidade, segurança ou pontualidade do transporte; o pagamento ou inadimplência entre as partes; danos, perdas ou avarias na carga; informações incorretas publicadas pelos usuários; acidentes ou incidentes durante o transporte.</p>
        </Section>

        <Section title="6. Créditos e Pagamentos">
          <p>A plataforma oferece um sistema de créditos virtuais que podem ser utilizados para destacar fretes na busca. Créditos são obtidos através do programa de convites ou aquisição futura. Créditos não têm valor monetário real e não podem ser convertidos em dinheiro.</p>
        </Section>

        <Section title="7. Propriedade Intelectual">
          <p>Todo o conteúdo da plataforma (design, código, marca, textos) é de propriedade do FreteTruck ou de seus licenciadores. É proibida a reprodução, distribuição ou modificação sem autorização prévia.</p>
        </Section>

        <Section title="8. Privacidade">
          <p>A coleta e uso de dados pessoais são regidos pela nossa <Link href="/privacidade" className="text-orange-600 hover:underline font-medium">Política de Privacidade</Link>.</p>
        </Section>

        <Section title="9. Modificações">
          <p>O FreteTruck pode alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas através da plataforma. O uso continuado após alterações constitui aceitação dos novos termos.</p>
        </Section>

        <Section title="10. Legislação Aplicável">
          <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca de São Paulo, Estado de São Paulo.</p>
        </Section>

        <Section title="11. Contato">
          <p>Para dúvidas sobre estes Termos, entre em contato através da <Link href="/ajuda" className="text-orange-600 hover:underline font-medium">Central de Ajuda</Link>.</p>
        </Section>
      </div>
    </div>
  );
}
