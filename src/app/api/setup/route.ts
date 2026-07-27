import { NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Endpoint de setup — cria todas as tabelas no banco de dados.
 * Acesse UMA VEZ após o deploy: https://seu-app.vercel.app/api/setup
 */
export async function POST() {
  const schema = `
    -- Usuários
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      name varchar(120) NOT NULL,
      email varchar(160) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      phone varchar(20) NOT NULL,
      role varchar(20) NOT NULL,
      company varchar(160),
      city varchar(120),
      state varchar(2),
      vehicle_type varchar(40),
      body_type varchar(40),
      plate_number varchar(15),
      avatar_url varchar(300),
      bio varchar(500),
      credits numeric(12,2) DEFAULT 0,
      verified boolean DEFAULT false,
      referral_code varchar(12) UNIQUE,
      referred_by int,
      invited_count int DEFAULT 0,
      terms_accepted_at timestamp,
      deleted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Fretes
    CREATE TABLE IF NOT EXISTS freights (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cargo_type varchar(120) NOT NULL,
      description text,
      origin_city varchar(120) NOT NULL,
      origin_state varchar(2) NOT NULL,
      dest_city varchar(120) NOT NULL,
      dest_state varchar(2) NOT NULL,
      distance_km int,
      weight_kg int NOT NULL,
      price numeric(12,2),
      price_type varchar(20) NOT NULL DEFAULT 'total',
      vehicle_types text NOT NULL,
      body_types text NOT NULL,
      needs_tracker boolean NOT NULL DEFAULT false,
      needs_tarp boolean NOT NULL DEFAULT false,
      toll boolean NOT NULL DEFAULT false,
      load_date varchar(20),
      contact_name varchar(120) NOT NULL,
      contact_phone varchar(20) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'ativo',
      views int NOT NULL DEFAULT 0,
      is_recurring boolean NOT NULL DEFAULT false,
      recurring_frequency varchar(20),
      delivered boolean NOT NULL DEFAULT false,
      delivered_at timestamp,
      delivered_by int,
      is_auction boolean NOT NULL DEFAULT false,
      min_price numeric(12,2),
      auction_ends_at timestamp,
      featured boolean NOT NULL DEFAULT false,
      insurance_quote jsonb,
      tracking_data jsonb,
      tracking_active boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Propostas
    CREATE TABLE IF NOT EXISTS proposals (
      id serial PRIMARY KEY,
      freight_id int NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
      driver_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount numeric(12,2),
      message text,
      status varchar(20) NOT NULL DEFAULT 'pendente',
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Favoritos
    CREATE TABLE IF NOT EXISTS favorites (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freight_id int NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Alertas
    CREATE TABLE IF NOT EXISTS alerts (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin_state varchar(2),
      dest_state varchar(2),
      vehicle_type varchar(40),
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Avaliações
    CREATE TABLE IF NOT EXISTS reviews (
      id serial PRIMARY KEY,
      rated_user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      author_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating int NOT NULL,
      comment text,
      punctuality int,
      communication int,
      payment_speed int,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Mensagens
    CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      sender_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freight_id int REFERENCES freights(id) ON DELETE SET NULL,
      content text NOT NULL,
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Notificações
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar(30) NOT NULL,
      title varchar(200) NOT NULL,
      body text,
      link varchar(200),
      read boolean NOT NULL DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Documentos
    CREATE TABLE IF NOT EXISTS documents (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_type varchar(30) NOT NULL,
      file_url varchar(400) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pendente',
      review_comment text,
      reviewed_by int,
      reviewed_at timestamp,
      expires_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Transações (legado)
    CREATE TABLE IF NOT EXISTS transactions (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount numeric(12,2) NOT NULL,
      type varchar(40) NOT NULL,
      description varchar(200),
      ref_id int,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Convites
    CREATE TABLE IF NOT EXISTS referrals (
      id serial PRIMARY KEY,
      inviter_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status varchar(20) NOT NULL DEFAULT 'pending',
      bonus_amount numeric(12,2),
      credited_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Posts da comunidade
    CREATE TABLE IF NOT EXISTS posts (
      id serial PRIMARY KEY,
      author_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      content text NOT NULL,
      category varchar(30) NOT NULL,
      city varchar(120),
      state varchar(2),
      image_url varchar(400),
      likes int NOT NULL DEFAULT 0,
      comment_count int NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Likes de posts
    CREATE TABLE IF NOT EXISTS post_likes (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id int NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Comentários
    CREATE TABLE IF NOT EXISTS post_comments (
      id serial PRIMARY KEY,
      post_id int NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id int REFERENCES post_comments(id) ON DELETE CASCADE,
      content text NOT NULL,
      likes int NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Likes de comentários
    CREATE TABLE IF NOT EXISTS comment_likes (
      id serial PRIMARY KEY,
      comment_id int NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Documentos fiscais (CT-e/MDF-e)
    CREATE TABLE IF NOT EXISTS fiscal_documents (
      id serial PRIMARY KEY,
      freight_id int NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doc_type varchar(10) NOT NULL,
      status varchar(30) NOT NULL DEFAULT 'rascunho',
      access_key varchar(44),
      protocol varchar(40),
      xml_content text,
      payload jsonb,
      error_message text,
      issued_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Eventos fiscais
    CREATE TABLE IF NOT EXISTS fiscal_events (
      id serial PRIMARY KEY,
      fiscal_id int NOT NULL REFERENCES fiscal_documents(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type varchar(30) NOT NULL,
      protocol varchar(40),
      reason text,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Carteiras de Trucks (moeda interna)
    CREATE TABLE IF NOT EXISTS truck_wallets (
      id serial PRIMARY KEY,
      user_id int NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      balance int NOT NULL DEFAULT 0,
      lifetime_earned int NOT NULL DEFAULT 0,
      lifetime_spent int NOT NULL DEFAULT 0,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Ledger de Trucks
    CREATE TABLE IF NOT EXISTS truck_ledger (
      id serial PRIMARY KEY,
      wallet_id int NOT NULL REFERENCES truck_wallets(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount int NOT NULL,
      balance_after int NOT NULL,
      type varchar(40) NOT NULL,
      description varchar(240) NOT NULL,
      reference_type varchar(40),
      reference_id int,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Produtos de Trucks
    CREATE TABLE IF NOT EXISTS truck_products (
      id serial PRIMARY KEY,
      code varchar(50) NOT NULL UNIQUE,
      name varchar(120) NOT NULL,
      description varchar(300),
      trucks int NOT NULL,
      price_cents int NOT NULL,
      active boolean NOT NULL DEFAULT true,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Configurações de monetização
    CREATE TABLE IF NOT EXISTS monetization_settings (
      id serial PRIMARY KEY,
      key varchar(80) NOT NULL UNIQUE,
      value jsonb NOT NULL,
      label varchar(160) NOT NULL,
      description varchar(300),
      updated_by int,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Pedidos de pagamento
    CREATE TABLE IF NOT EXISTS billing_orders (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id int NOT NULL REFERENCES truck_products(id),
      status varchar(20) NOT NULL DEFAULT 'pending',
      provider varchar(30) NOT NULL DEFAULT 'manual_beta',
      provider_reference varchar(160),
      amount_cents int NOT NULL,
      trucks int NOT NULL,
      paid_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Planos de assinatura
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id serial PRIMARY KEY,
      code varchar(50) NOT NULL UNIQUE,
      name varchar(100) NOT NULL,
      audience varchar(30) NOT NULL,
      price_cents int NOT NULL,
      interval varchar(20) NOT NULL DEFAULT 'month',
      trucks_included int NOT NULL DEFAULT 0,
      features jsonb NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Assinaturas de usuários
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id int NOT NULL REFERENCES subscription_plans(id),
      status varchar(20) NOT NULL DEFAULT 'active',
      current_period_start timestamp DEFAULT now() NOT NULL,
      current_period_end timestamp,
      provider varchar(30) DEFAULT 'manual_beta',
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Logs de auditoria
    CREATE TABLE IF NOT EXISTS audit_logs (
      id serial PRIMARY KEY,
      user_id int,
      actor_email varchar(160),
      action varchar(60) NOT NULL,
      entity varchar(40),
      entity_id int,
      details jsonb,
      ip varchar(60),
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Sessões
    CREATE TABLE IF NOT EXISTS sessions (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token varchar(200) NOT NULL UNIQUE,
      user_agent varchar(300),
      ip varchar(60),
      last_seen_at timestamp DEFAULT now() NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Reset de senhas
    CREATE TABLE IF NOT EXISTS password_resets (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token varchar(64) NOT NULL UNIQUE,
      used boolean NOT NULL DEFAULT false,
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Frotas
    CREATE TABLE IF NOT EXISTS fleets (
      id serial PRIMARY KEY,
      owner_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name varchar(160) NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Motoristas de frotas
    CREATE TABLE IF NOT EXISTS fleet_drivers (
      id serial PRIMARY KEY,
      fleet_id int NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
      driver_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plate_number varchar(15),
      vehicle_type varchar(40),
      status varchar(20) NOT NULL DEFAULT 'disponivel',
      joined_at timestamp DEFAULT now() NOT NULL
    );

    -- Cotações de seguro
    CREATE TABLE IF NOT EXISTS insurance_quotes (
      id serial PRIMARY KEY,
      freight_id int NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cargo_value numeric(12,2),
      distance_km int,
      premium numeric(12,2),
      coverage varchar(30) NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Media uploads
    CREATE TABLE IF NOT EXISTS media_uploads (
      id serial PRIMARY KEY,
      filename varchar(160) NOT NULL UNIQUE,
      mime_type varchar(60) NOT NULL,
      data_base64 text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Configurações de integração
    CREATE TABLE IF NOT EXISTS integration_settings (
      id serial PRIMARY KEY,
      key varchar(80) NOT NULL UNIQUE,
      value text,
      category varchar(40) NOT NULL DEFAULT 'geral',
      label varchar(160) NOT NULL,
      description varchar(400),
      is_secret boolean NOT NULL DEFAULT false,
      is_public boolean NOT NULL DEFAULT false,
      updated_by int,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Posições de rastreamento
    CREATE TABLE IF NOT EXISTS tracking_positions (
      id serial PRIMARY KEY,
      freight_id int NOT NULL REFERENCES freights(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lat numeric(10,7) NOT NULL,
      lng numeric(10,7) NOT NULL,
      accuracy numeric(8,2),
      speed_kmh numeric(6,2),
      heading numeric(6,2),
      source varchar(20) NOT NULL DEFAULT 'gps',
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Feedback reports
    CREATE TABLE IF NOT EXISTS feedback_reports (
      id serial PRIMARY KEY,
      user_id int REFERENCES users(id) ON DELETE SET NULL,
      name varchar(120),
      email varchar(160),
      type varchar(30) NOT NULL DEFAULT 'bug',
      priority varchar(20) NOT NULL DEFAULT 'normal',
      status varchar(20) NOT NULL DEFAULT 'novo',
      page_url varchar(500),
      message text NOT NULL,
      user_agent varchar(300),
      admin_note text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Comunicados
    CREATE TABLE IF NOT EXISTS system_announcements (
      id serial PRIMARY KEY,
      title varchar(160) NOT NULL,
      message text NOT NULL,
      variant varchar(20) NOT NULL DEFAULT 'info',
      link_label varchar(80),
      link_url varchar(300),
      active boolean NOT NULL DEFAULT true,
      starts_at timestamp DEFAULT now() NOT NULL,
      ends_at timestamp,
      created_by int REFERENCES users(id) ON DELETE SET NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Feature flags
    CREATE TABLE IF NOT EXISTS feature_flags (
      id serial PRIMARY KEY,
      key varchar(80) NOT NULL UNIQUE,
      label varchar(160) NOT NULL,
      description varchar(400),
      enabled boolean NOT NULL DEFAULT false,
      audience varchar(40) NOT NULL DEFAULT 'all',
      updated_by int REFERENCES users(id) ON DELETE SET NULL,
      updated_at timestamp DEFAULT now() NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Cupons de Trucks
    CREATE TABLE IF NOT EXISTS truck_coupons (
      id serial PRIMARY KEY,
      code varchar(40) NOT NULL UNIQUE,
      trucks int NOT NULL,
      max_uses int NOT NULL DEFAULT 100,
      used_count int NOT NULL DEFAULT 0,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Cupons resgatados por usuário
    CREATE TABLE IF NOT EXISTS user_coupons (
      id serial PRIMARY KEY,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      coupon_id int NOT NULL REFERENCES truck_coupons(id) ON DELETE CASCADE,
      redeemed_at timestamp DEFAULT now() NOT NULL
    );

    -- Denúncias de moderação
    CREATE TABLE IF NOT EXISTS content_reports (
      id serial PRIMARY KEY,
      user_id int REFERENCES users(id) ON DELETE SET NULL,
      target_type varchar(30) NOT NULL,
      target_id int NOT NULL,
      reason varchar(60) NOT NULL,
      details text,
      status varchar(20) NOT NULL DEFAULT 'pendente',
      created_at timestamp DEFAULT now() NOT NULL
    );

    -- Roadmap e Votos
    CREATE TABLE IF NOT EXISTS roadmap_features (
      id serial PRIMARY KEY,
      title varchar(120) NOT NULL UNIQUE,
      description varchar(400) NOT NULL,
      category varchar(30) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'planejado',
      votes_count int NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap_votes (
      id serial PRIMARY KEY,
      feature_id int NOT NULL REFERENCES roadmap_features(id) ON DELETE CASCADE,
      user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp DEFAULT now() NOT NULL,
      CONSTRAINT unique_user_feature_vote UNIQUE(user_id, feature_id)
    );
  `;

  try {
    await pool.query(schema);

    // Inserir dados demo (admin padrão)
    const { randomBytes, scryptSync } = await import("crypto");
    const hashPassword = (pw: string) => {
      const salt = randomBytes(16).toString("hex");
      return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
    };

    await pool.query(`
      INSERT INTO users (name, email, password_hash, phone, role, credits, verified, referral_code)
      VALUES 
        ('Admin Demo', 'demo@fretetruck.com.br', $1, '65999990001', 'admin', 50, true, 'ADMIN2025')
      ON CONFLICT (email) DO NOTHING
    `, [hashPassword("demo123")]);

    await pool.query(`
      INSERT INTO monetization_settings (key, value, label, description)
      VALUES 
        ('featured_freight_cost', '15', 'Custo para destacar frete', 'Quantidade de Trucks'),
        ('referral_reward', '25', 'Bônus por indicação', 'Trucks creditados'),
        ('free_monthly_featured', '0', 'Destaques grátis', 'Cota mensal'),
        ('beta_payments_enabled', 'true', 'Pagamentos beta', 'Modo manual'),
        ('commission_percent', '0', 'Comissão sobre frete', '0% no marketplace'),
        ('max_free_posts_month', '10', 'Publicações grátis', 'Limite mensal')
      ON CONFLICT (key) DO NOTHING
    `);

    await pool.query(`
      INSERT INTO feature_flags (key, label, description, enabled, audience) VALUES
        ('public_beta', 'Beta público', 'Exibe avisos e comportamentos do beta público.', true, 'all'),
        ('mercado_pago_live', 'Mercado Pago produção', 'Ativa cobrança real em produção quando credenciais estiverem configuradas.', false, 'admin'),
        ('gps_live_tracking', 'Rastreamento GPS ao vivo', 'Permite que motoristas compartilhem GPS real pelo navegador/app.', true, 'all'),
        ('fiscal_module', 'Módulo CT-e / MDF-e', 'Mostra o módulo fiscal em modo homologação/simulado.', true, 'all'),
        ('community_images', 'Imagens na comunidade', 'Permite upload de fotos em postagens sociais.', true, 'all')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO truck_coupons (code, trucks, max_uses, active) VALUES
        ('BETA50', 50, 1000, true),
        ('FRETETRUCK2025', 100, 500, true)
      ON CONFLICT (code) DO NOTHING;

      INSERT INTO system_announcements (title, message, variant, link_label, link_url, active)
      VALUES ('Beta público FreteTruck', 'Estamos em fase de testes. Envie feedbacks e relatos de erro para melhorarmos a plataforma.', 'warning', 'Enviar feedback', '/feedback', true)
      ON CONFLICT DO NOTHING;

      INSERT INTO roadmap_features (title, description, category, status, votes_count) VALUES
        ('Circuito Inteligente de Fretes', 'Sugere rotas circulares (Ida + Retorno + Carga Intermediária) para maximizar faturamento semanal e evitar rodar vazio.', 'motorista', 'planejado', 42),
        ('Integração com WhatsApp Real (Bot)', 'Receba notificações e envie propostas direto no WhatsApp sem abrir o aplicativo.', 'social', 'em_desenvolvimento', 88),
        ('Emissão real de CT-e / MDF-e via SEFAZ', 'Suporte à assinatura com Certificado A1 e emissão oficial para a SEFAZ com DACTE em PDF real.', 'fiscal', 'em_desenvolvimento', 124),
        ('Reações de Emojis no Mural', 'Interaja com posts e comentários usando emojis divertidos como 🔥, 👏, 🚛, 💡.', 'social', 'planejado', 29),
        ('Calculadora Avançada com Consumo Real', 'Integração com preços de diesel por posto e cálculos de desgaste real por tipo de caminhão.', 'motorista', 'planejado', 35),
        ('Score de Crédito do Embarcador', 'Classificação financeira do contratante baseada em pagamentos anteriores, CNPJ e histórico na plataforma.', 'embarcador', 'planejado', 67),
        ('Inclusão de Comprovante de Entrega por Foto no App', 'O motorista fotografa o canhoto assinado e anexa direto no comprovante digital (POD).', 'fiscal', 'planejado', 95)
      ON CONFLICT (title) DO NOTHING;
    `);

    return NextResponse.json({
      success: true,
      message: "✅ Schema aplicado com sucesso! Todas as tabelas foram criadas.",
      tables_created: 35,
    });
  } catch (e: any) {
    console.error("[SETUP ERROR]", e);
    return NextResponse.json(
      {
        success: false,
        error: e.message,
        hint: "Verifique se a DATABASE_URL está correta e tem permissões de CREATE TABLE.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint de setup. Faça POST para criar todas as tabelas no banco.",
    usage: "POST /api/setup",
  });
}
