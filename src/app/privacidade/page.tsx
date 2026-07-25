import Link from "next/link";

export default function PrivacidadePage() {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{title}</h2>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">{children}</div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Última atualização: Janeiro 2025 — Em conformidade com a LGPD (Lei 13.709/2018)</p>

      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
        <Section title="1. Dados que Coletamos">
          <p><strong>Dados de cadastro:</strong> nome, e-mail, telefone/WhatsApp, cidade, estado, tipo de veículo, empresa.</p>
          <p><strong>Dados de uso:</strong> fretes publicados, propostas enviadas, mensagens no chat, avaliações, favoritos, alertas de rota.</p>
          <p><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, páginas acessadas, horários de acesso.</p>
          <p><strong>Documentos:</strong> CNH, RNTC, CRVL e CLTM enviados voluntariamente para verificação de conta.</p>
        </Section>

        <Section title="2. Como Usamos seus Dados">
          <p>Seus dados são utilizados para: operar e manter a plataforma; conectar motoristas e embarcadores; processar propostas e mensagens; exibir seu perfil público (nome, cidade, avaliações); calcular estatísticas e rankings; enviar notificações sobre propostas, mensagens e atualizações; prevenir fraudes e atividades abusivas.</p>
        </Section>

        <Section title="3. Compartilhamento de Dados">
          <p>Dados compartilhados publicamente no seu perfil: nome, cidade/estado, avaliações, badges, nível. Dados compartilhados com outro usuário ao interagir: nome e telefone de contato no frete, mensagens no chat. Nunca vendemos seus dados pessoais para terceiros.</p>
        </Section>

        <Section title="4. Armazenamento e Segurança">
          <p>Senhas são armazenadas com hash criptográfico (scrypt) e nunca em texto simples. Sessões são assinadas com HMAC-SHA256. Documentos enviados são armazenados em servidor seguro. Acesso ao banco de dados é restrito e protegido por autenticação.</p>
        </Section>

        <Section title="5. Seus Direitos (LGPD)">
          <p>Conforme a LGPD, você tem direito a: acessar seus dados pessoais; corrigir dados incorretos (página Configurações); solicitar a exclusão da sua conta e dados; revogar consentimento a qualquer momento; solicitar portabilidade dos dados.</p>
          <p>Para exercer esses direitos, acesse <Link href="/configuracoes" className="text-orange-600 hover:underline font-medium">Configurações</Link> ou entre em contato pela <Link href="/ajuda" className="text-orange-600 hover:underline font-medium">Central de Ajuda</Link>.</p>
        </Section>

        <Section title="6. Cookies">
          <p>Utilizamos cookies estritamente necessários para: manter sua sessão de login (cookie httpOnly); armazenar sua preferência de tema (claro/escuro) via localStorage. Não utilizamos cookies de rastreamento ou publicidade.</p>
        </Section>

        <Section title="7. Retenção de Dados">
          <p>Dados de conta são mantidos enquanto sua conta estiver ativa. Fretes fechados são mantidos por 12 meses para fins de histórico. Documentos verificados são mantidos enquanto necessário para manter o selo de verificação. Ao excluir sua conta, todos os dados pessoais são removidos em até 30 dias.</p>
        </Section>

        <Section title="8. Alterações">
          <p>Esta política pode ser atualizada periodicamente. Alterações significativas serão notificadas através da plataforma.</p>
        </Section>

        <Section title="9. Contato do Encarregado de Dados">
          <p>Para questões relacionadas à privacidade e proteção de dados, entre em contato pela <Link href="/ajuda" className="text-orange-600 hover:underline font-medium">Central de Ajuda</Link>.</p>
        </Section>
      </div>
    </div>
  );
}
