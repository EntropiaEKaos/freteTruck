import { NextResponse } from "next/server";
import { db } from "@/db";
import { integrationSettings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
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

  const rows = await db.select().from(integrationSettings).orderBy(asc(integrationSettings.category), asc(integrationSettings.id));

  // Mascara segredos, mas informa se estão preenchidos
  const settings = rows.map((r) => ({
    ...r,
    value: r.isSecret && r.value ? "" : r.value,
    hasValue: Boolean(r.value && r.value.length > 0),
  }));

  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const b = await req.json();
  if (!b.key) return NextResponse.json({ error: "Chave obrigatória." }, { status: 400 });

  const value = typeof b.value === "string" ? b.value.trim() : String(b.value ?? "");

  const existing = await db.select().from(integrationSettings).where(eq(integrationSettings.key, b.key)).limit(1);
  if (existing.length === 0) {
    return NextResponse.json({ error: "Configuração não encontrada." }, { status: 404 });
  }

  await db
    .update(integrationSettings)
    .set({ value, updatedBy: admin.id, updatedAt: new Date() })
    .where(eq(integrationSettings.key, b.key));

  await auditLog({
    userId: admin.id,
    actorEmail: admin.email,
    action: "admin.integration_update",
    entity: "integration_setting",
    details: { key: b.key, filled: value.length > 0 },
  });

  return NextResponse.json({ ok: true });
}
