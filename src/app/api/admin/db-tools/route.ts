import { NextResponse } from "next/server";
import { pool } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  try {
    const res = await pool.query(`
      SELECT 'users' AS table_name, count(*)::int AS count FROM users
      UNION ALL SELECT 'freights', count(*)::int FROM freights
      UNION ALL SELECT 'proposals', count(*)::int FROM proposals
      UNION ALL SELECT 'messages', count(*)::int FROM messages
      UNION ALL SELECT 'notifications', count(*)::int FROM notifications
      UNION ALL SELECT 'reviews', count(*)::int FROM reviews
      UNION ALL SELECT 'posts', count(*)::int FROM posts
      UNION ALL SELECT 'post_comments', count(*)::int FROM post_comments
      UNION ALL SELECT 'media_uploads', count(*)::int FROM media_uploads
      UNION ALL SELECT 'truck_wallets', count(*)::int FROM truck_wallets
      UNION ALL SELECT 'truck_ledger', count(*)::int FROM truck_ledger
      UNION ALL SELECT 'billing_orders', count(*)::int FROM billing_orders
      UNION ALL SELECT 'fiscal_documents', count(*)::int FROM fiscal_documents
      UNION ALL SELECT 'feedback_reports', count(*)::int FROM feedback_reports
      UNION ALL SELECT 'system_announcements', count(*)::int FROM system_announcements
      UNION ALL SELECT 'feature_flags', count(*)::int FROM feature_flags
      UNION ALL SELECT 'truck_coupons', count(*)::int FROM truck_coupons
      UNION ALL SELECT 'content_reports', count(*)::int FROM content_reports
      ORDER BY 1
    `);

    return NextResponse.json({ tables: res.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { action } = await req.json();

  if (action === "sync_schema") {
    try {
      // Executar criação do schema via /api/setup query
      const { POST: runSetup } = await import("@/app/api/setup/route");
      const res = await runSetup();
      const data = await res.json();
      await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.db_sync_schema", entity: "db", details: data });
      return NextResponse.json(data);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "seed_demo") {
    try {
      // Inserir dados de exemplo realistas para teste de produção
      const { randomBytes, scryptSync } = await import("crypto");
      const hashPassword = (pw: string) => {
        const salt = randomBytes(16).toString("hex");
        return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
      };

      // Inserir 3 usuários demo
      const userRes = await pool.query(`
        INSERT INTO users (name, email, password_hash, phone, role, company, city, state, vehicle_type, body_type, credits, verified, referral_code)
        VALUES
          ('Fernanda Souza', 'fernanda@grancargo.com.br', $1, '11999990002', 'embarcador', 'GranCargo Logística', 'São Paulo', 'SP', null, null, 50, true, '33C45A71'),
          ('Roberto Lima', 'roberto@sulfrete.com.br', $1, '51999990003', 'embarcador', 'SulFrete Agenciamento', 'Porto Alegre', 'RS', null, null, 50, true, 'B7FC5D0C'),
          ('Marcos Caminhoneiro', 'marcos@gmail.com', $1, '62999990004', 'motorista', null, 'Goiânia', 'GO', 'Carreta', 'Graneleiro', 30, true, 'C5E43A33')
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email
      `, [hashPassword("senha123")]);

      // Buscar IDs de usuários para atribuir fretes
      const usersQuery = await pool.query("SELECT id, email FROM users WHERE deleted_at IS NULL");
      const userMap = Object.fromEntries(usersQuery.rows.map((r: { id: number; email: string }) => [r.email, r.id]));
      const ownerId = userMap["demo@fretetruck.com.br"] || userMap["fernanda@grancargo.com.br"] || 1;

      // Inserir fretes realistas
      await pool.query(`
        INSERT INTO freights (user_id, cargo_type, description, origin_city, origin_state, dest_city, dest_state, distance_km, weight_kg, price, price_type, vehicle_types, body_types, needs_tracker, needs_tarp, toll, contact_name, contact_phone, views, status, is_auction, featured, tracking_active)
        VALUES
          ($1, 'Grãos (Soja, Milho, etc)', 'Carregamento no armazém da BR-163. Descarga no Porto de Santos, terminal 12. Necessário lona nova.', 'Sorriso', 'MT', 'Santos', 'SP', 1980, 37000, 9500.00, 'total', 'Carreta,Bitrem,Rodotrem', 'Graneleiro', true, true, true, 'Carlos Demo', '65999990001', 68, 'ativo', false, true, false),
          ($1, 'Fertilizantes', 'Big bags de 1 tonelada. Carregamento com pá carregadeira.', 'Rondonópolis', 'MT', 'Rio Verde', 'GO', 420, 32000, 180.00, 'tonelada', 'Carreta,Bitruck', 'Graneleiro,Caçamba', false, true, false, 'Carlos Demo', '65999990001', 227, 'ativo', false, true, false),
          ($1, 'Carga Geral', 'Carga paletizada, 28 paletes. Agendamento de descarga obrigatório.', 'São Paulo', 'SP', 'Recife', 'PE', 2660, 24000, 13800.00, 'total', 'Carreta,Carreta LS', 'Baú,Sider', true, false, true, 'Carlos Demo', '65999990001', 249, 'ativo', false, true, false)
      `, [ownerId]);

      await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.seed_demo", entity: "db" });

      return NextResponse.json({
        success: true,
        message: "✅ Banco populado com usuários de teste e fretes demonstrativos com sucesso!",
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
