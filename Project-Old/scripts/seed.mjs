import { Pool } from "pg";
import { randomBytes, scryptSync } from "crypto";
import { readFileSync } from "fs";

// load DATABASE_URL from .env
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const m = env.match(/DATABASE_URL=(.+)/);
    dbUrl = m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {}
}
if (!dbUrl) {
  console.error("DATABASE_URL não encontrada. Configure o .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function refCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function main() {
  const { rows: existing } = await pool.query("SELECT COUNT(*)::int AS c FROM users");
  if (existing[0].c > 0) {
    console.log("Seed já executado, pulando.");
    await pool.end();
    return;
  }

  // ============ USERS ============
  // NOTE: Carlos Demo tem role='admin' para acessar /admin
  const usersData = [
    ["Carlos Demo", "demo@fretetruck.com.br", "demo123", "65999990001", "admin", "AgroLog Transportes", "Cuiabá", "MT", null, null, 50, true],
    ["Fernanda Souza", "fernanda@grancargo.com.br", "senha123", "11999990002", "embarcador", "GranCargo Logística", "São Paulo", "SP", null, null, 50],
    ["Roberto Lima", "roberto@sulfrete.com.br", "senha123", "51999990003", "embarcador", "SulFrete Agenciamento", "Porto Alegre", "RS", null, null, 50],
    ["Marcos Caminhoneiro", "marcos@gmail.com", "senha123", "62999990004", "motorista", null, "Goiânia", "GO", "Carreta", "Graneleiro", 30],
  ];

  const userIds = [];
  for (const [name, email, pw, phone, role, company, city, state, vType, bType, credits, isVerified] of usersData) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role, company, city, state, vehicle_type, body_type, credits, referral_code, verified, invited_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,0) RETURNING id`,
      [name, email, hashPassword(pw), phone, role, company, city, state, vType, bType, credits, refCode(), isVerified || false]
    );
    userIds.push(rows[0].id);
  }
  console.log(`✅ ${userIds.length} usuários criados (Carlos Demo = admin)`);

  // ============ FREIGHTS ============
  const freightsData = [
    [0, "Grãos (Soja, Milho, etc)", "Sorriso", "MT", "Santos", "SP", 1980, 37000, "9500.00", "total", "Carreta,Bitrem,Rodotrem", "Graneleiro", true, true, true, "Carregamento no armazém da BR-163. Descarga no Porto de Santos, terminal 12. Necessário lona nova."],
    [0, "Fertilizantes", "Rondonópolis", "MT", "Rio Verde", "GO", 420, 32000, "180.00", "tonelada", "Carreta,Bitruck", "Graneleiro,Caçamba", false, true, false, "Big bags de 1 tonelada. Carregamento com pá carregadeira."],
    [1, "Carga Geral", "São Paulo", "SP", "Recife", "PE", 2660, 24000, "13800.00", "total", "Carreta,Carreta LS", "Baú,Sider", true, false, true, "Carga paletizada, 28 paletes. Agendamento de descarga obrigatório."],
    [1, "Eletrodomésticos", "Manaus", "AM", "São Paulo", "SP", 3890, 22000, null, "combinar", "Carreta", "Baú", true, false, false, "Saída da Zona Franca. Exige gerenciamento de risco e escolta em trechos."],
    [1, "Produtos Alimentícios", "Uberlândia", "MG", "Brasília", "DF", 440, 14000, "2600.00", "total", "Truck,Bitruck", "Baú Frigorífico", false, false, true, "Carga refrigerada -18°C. Aparelho de frio em bom estado."],
    [2, "Madeira", "Caçador", "SC", "Curitiba", "PR", 300, 28000, "2100.00", "total", "Carreta,Truck", "Grade Baixa,Prancha", false, true, false, "Toras de pinus. Carregamento com grua no pátio da serraria."],
    [2, "Bebidas", "Porto Alegre", "RS", "Florianópolis", "SC", 460, 26000, "3200.00", "total", "Carreta,Bitruck", "Baú,Sider", false, false, true, "Paletes de cerveja. Descarga em CD com agendamento."],
    [2, "Cimento", "Ijaci", "MG", "Campinas", "SP", 330, 35000, "150.00", "tonelada", "Carreta,Bitrem", "Graneleiro,Caçamba", false, true, false, "Cimento a granel ou ensacado, conforme disponibilidade."],
    [0, "Algodão", "Sapezal", "MT", "Paranaguá", "PR", 2100, 30000, "11200.00", "total", "Carreta,Rodotrem", "Graneleiro,Sider", true, true, true, "Fardos de algodão para exportação. Prioridade para rastreados."],
    [1, "Máquinas e Equipamentos", "Joinville", "SC", "Salvador", "BA", 2450, 18000, "14500.00", "total", "Carreta,Carreta LS", "Prancha,Grade Baixa", true, false, true, "Máquina industrial. Necessário amarração especializada e prancha rebaixada."],
    [2, "Ração Animal", "Chapecó", "SC", "Dourados", "MS", 780, 33000, "175.00", "tonelada", "Carreta,Bitrem", "Graneleiro", false, true, false, "Ração ensacada 25kg em paletes."],
    [0, "Frutas e Verduras", "Petrolina", "PE", "São Paulo", "SP", 2050, 20000, "9800.00", "total", "Carreta,Truck", "Baú Frigorífico", false, false, true, "Manga e uva para CEAGESP. Temperatura controlada 8°C. Carregamento madrugada."],
  ];

  for (const [ui, cargo, oc, os, dc, ds, km, kg, price, pt, veh, bod, tracker, tarp, toll, desc] of freightsData) {
    const owner = usersData[ui];
    await pool.query(
      `INSERT INTO freights
        (user_id, cargo_type, description, origin_city, origin_state, dest_city, dest_state,
         distance_km, weight_kg, price, price_type, vehicle_types, body_types,
         needs_tracker, needs_tarp, toll, contact_name, contact_phone, views, status,
         is_auction, featured, tracking_active,
         created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'ativo',
               false,false,false,
               NOW() - ($20 || ' hours')::interval)`,
      [
        userIds[ui], cargo, desc, oc, os, dc, ds, km, kg, price, pt, veh, bod,
        tracker, tarp, toll, owner[0], owner[3],
        Math.floor(Math.random() * 300) + 15,
        Math.floor(Math.random() * 72) + 1,
      ]
    );
  }
  console.log(`✅ ${freightsData.length} fretes criados`);

  // ============ REVIEWS ============
  await pool.query(`
    INSERT INTO reviews (rated_user_id, author_id, rating, comment, punctuality, communication, payment_speed) VALUES
    ($1, $4, 5, 'Pagamento rápido e carregamento sem demora. Recomendo!', 5, 5, 5),
    ($1, $2, 4, 'Boa empresa, comunicação clara.', 4, 4, 4),
    ($2, $4, 5, 'Excelente embarcadora, adiantamento na hora.', 5, 5, 5),
    ($3, $4, 3, 'Frete ok, mas demorou um pouco na descarga.', 2, 4, 3)
  `, [userIds[0], userIds[1], userIds[2], userIds[3]]);
  console.log("✅ 4 avaliações criadas");

  // ============ PROPOSALS ============
  const { rows: firstFreight } = await pool.query("SELECT id, origin_city, origin_state, dest_city, dest_state FROM freights WHERE user_id=$1 ORDER BY id LIMIT 1", [userIds[0]]);
  if (firstFreight.length > 0) {
    await pool.query(
      "INSERT INTO proposals (freight_id, driver_id, amount, message, status) VALUES ($1,$2,9200.00,'Tenho carreta graneleira com rastreador, posso carregar amanhã cedo.','pendente')",
      [firstFreight[0].id, userIds[3]]
    );
    console.log("✅ 1 proposta pendente criada");
  }

  // ============ MESSAGES ============
  await pool.query(`
    INSERT INTO messages (sender_id, receiver_id, content, read, created_at) VALUES
    ($2, $1, 'Boa tarde! Vi seu frete Sorriso/MT → Santos/SP. Tenho carreta graneleira disponível para carregar amanhã. Qual horário?', true, NOW() - interval '3 hours'),
    ($1, $2, 'Olá Marcos! Carregamento a partir das 7h na BR-163. Pode confirmar se tem rastreador?', true, NOW() - interval '2 hours'),
    ($2, $1, 'Tenho sim! Rastreador Sascar ativo. Posso estar aí amanhã às 7h. Vamos fechar?', false, NOW() - interval '1 hour')
  `, [userIds[0], userIds[3]]);
  console.log("✅ 3 mensagens de chat criadas");

  // ============ NOTIFICATIONS ============
  await pool.query(`
    INSERT INTO notifications (user_id, type, title, body, link, read) VALUES
    ($1, 'proposal_received', '📨 Nova proposta de Marcos Caminhoneiro', 'Frete Sorriso/MT → Santos/SP — Valor: R$ 9.200,00', '/painel', false),
    ($1, 'review', '⭐ Nova avaliação recebida', 'Marcos Caminhoneiro te avaliou com 5 estrelas!', '/perfil/' || $1, true)
  `, [userIds[0]]);
  console.log("✅ 2 notificações criadas");

  // ============ COMMUNITY POSTS ============
  const postsData = [
    [0, 'Preço do diesel em Sorriso-MT hoje', 'Diesel S10: R$ 6,15 | Diesel S11: R$ 5,95. Posto Shell BR-163 km 12. Abaixo da média nacional!', 'diesel', 'Sorriso', 'MT', 24],
    [3, 'Rodovia BR-163 com buracos graves', 'Trecho entre Sorriso e Rondonópolis está com buracos enormes entre km 80 e km 120. Cuidado com pneus e eixo!', 'rodovia', 'Sorriso', 'MT', 42],
    [1, 'Dica: melhor época para frete MG-SP', 'Entre setembro e novembro tem menos carga no sentido MG-SP, preços caem 15-20%. Se puder programar, vale esperar.', 'dica', 'Uberlândia', 'MG', 18],
    [2, 'Preço da tonelada soja em Porto Alegre', 'Soja em Porto Alegre cotada a R$ 125/ton. Impacta fretes MT-RS. Quem tem carga de grão, aproveite.', 'mercado', 'Porto Alegre', 'RS', 15],
    [3, 'Alerta: fiscalização na BR-060', 'Blitz pesada na BR-060 km 35 (perto de Goiânia). Verifiquem documentos e peso!', 'alerta', 'Goiânia', 'GO', 31],
    [0, 'Posto com desconto em Cuiabá', 'Posto Ipiranga na Av. Getúlio Vargas, Cuiabá. Diesel R$ 5,89 com cartão do posto. Validade até fim do mês.', 'diesel', 'Cuiabá', 'MT', 27],
    [1, 'Mercado de frete aquecido em SP', 'Demanda alta por carretas saindo de SP para Sul e Sudeste. Motoristas cobrando até 15% acima do normal.', 'mercado', 'São Paulo', 'SP', 22],
  ];
  for (const [ui, title, content, cat, city, state, likes] of postsData) {
    await pool.query(
      "INSERT INTO posts (author_id, title, content, category, city, state, likes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() - ($8 || ' hours')::interval)",
      [userIds[ui], title, content, cat, city, state, likes, Math.floor(Math.random() * 48) + 1]
    );
  }
  console.log(`✅ ${postsData.length} posts comunitários criados`);

  // ============ FLEET ============
  const { rows: fleetRows } = await pool.query(
    "INSERT INTO fleets (owner_id, name) VALUES ($1, 'Frota AgroLog') RETURNING id",
    [userIds[0]]
  );
  await pool.query(
    "INSERT INTO fleet_drivers (fleet_id, driver_id, plate_number, vehicle_type, status) VALUES ($1, $2, 'ABC-1234', 'Carreta', 'disponivel')",
    [fleetRows[0].id, userIds[3]]
  );
  console.log("✅ 1 frota + 1 motorista associado");

  console.log("");
  console.log("========================================");
  console.log("  SEED CONCLUÍDO COM SUCESSO! 🚛");
  console.log("========================================");
  console.log("");
  console.log("Contas de acesso:");
  console.log("  🛡️  Admin:      demo@fretetruck.com.br / demo123");
  console.log("  🏭 Embarcadora: fernanda@grancargo.com.br / senha123");
  console.log("  🏭 Transport.:  roberto@sulfrete.com.br / senha123");
  console.log("  🚛 Motorista:   marcos@gmail.com / senha123");

  await pool.end();
}

main().catch((e) => {
  console.error("❌ Erro no seed:", e);
  process.exit(1);
});
