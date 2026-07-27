import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, eq, ilike, or, and, gte, type SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const q = searchParams.get("q");
  const days = parseInt(searchParams.get("days") || "30", 10);

  const conditions: SQL[] = [];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (q) conditions.push(or(ilike(auditLogs.actorEmail, `%${q}%`), ilike(auditLogs.entity, `%${q}%`))!);
  if (days > 0) conditions.push(gte(auditLogs.createdAt, new Date(Date.now() - days * 86400000)));

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  // Ações disponíveis para o filtro
  const actions = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs)
    .orderBy(auditLogs.action);

  return NextResponse.json({
    logs: rows,
    actions: actions.map((a) => a.action).filter(Boolean),
  });
}
