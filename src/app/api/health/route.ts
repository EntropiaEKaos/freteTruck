import { NextResponse } from "next/server";
import { pool } from "@/db";

export async function GET() {
  try {
    const dbResult = await pool.query("SELECT NOW() as time, (SELECT count(*)::int FROM users) as users, (SELECT count(*)::int FROM freights) as freights");
    const row = dbResult.rows[0];
    return NextResponse.json({
      status: "healthy",
      timestamp: row.time,
      database: "connected",
      stats: { users: row.users, freights: row.freights },
      version: "1.0.0",
    });
  } catch (e) {
    return NextResponse.json({ status: "unhealthy", database: "disconnected", error: String(e) }, { status: 503 });
  }
}
