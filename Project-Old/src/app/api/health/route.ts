import { NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  const maskedUrl = dbUrl
    ? dbUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@")
    : "NÃO CONFIGURADA";

  let dbStatus = "disconnected";
  let dbError: string | null = null;
  let users = 0;
  let freights = 0;

  try {
    const res = await pool.query(
      "SELECT NOW() as time, (SELECT count(*)::int FROM users WHERE deleted_at IS NULL) as users, (SELECT count(*)::int FROM freights) as freights"
    );
    const row = res.rows[0];
    dbStatus = "connected";
    users = row.users;
    freights = row.freights;
  } catch (e: any) {
    dbError = e?.message || String(e);
  }

  return NextResponse.json(
    {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        url: maskedUrl,
        ssl: dbUrl.includes("neon") || dbUrl.includes("supabase") || dbUrl.includes("sslmode=require"),
        error: dbError,
      },
      stats: { users, freights },
      version: "1.0.0",
      environment: process.env.NODE_ENV,
    },
    { status: dbStatus === "connected" ? 200 : 503 }
  );
}
