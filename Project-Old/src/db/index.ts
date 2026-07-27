import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  "";

if (!databaseUrl) {
  console.warn(
    "⚠️ DATABASE_URL não definida! Configure nas Environment Variables do Vercel/Railway/Render."
  );
}

// Configuração de SSL obrigatória para provedores cloud (Neon, Supabase, Railway, etc)
function parseSslConfig() {
  const url = databaseUrl || "";
  const isNeon = url.includes("neon.tech") || url.includes("neon");
  const isSupabase = url.includes("supabase");
  const isRailway = url.includes("railway");
  const isFly = url.includes("fly.dev");
  const needsSsl = isNeon || isSupabase || isRailway || isFly || url.includes("sslmode=require");

  if (needsSsl) {
    // Neon e Supabase exigem SSL mas usam certificados próprios
    return { rejectUnauthorized: false };
  }
  return false;
}

// Configuração do pool otimizada para serverless (Vercel) e long-running (Railway)
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: parseSslConfig(),
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    // Neon com PgBouncer precisa disso
    ...(databaseUrl.includes("neon") ? { application_name: "fretetruck" } : {}),
  });

// Reutiliza o pool entre hot reloads em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
