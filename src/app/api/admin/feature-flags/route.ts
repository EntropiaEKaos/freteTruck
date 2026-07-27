import { NextResponse } from "next/server";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const flags = await db.select().from(featureFlags).orderBy(asc(featureFlags.key));
  return NextResponse.json({ flags });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const b = await req.json();
  const id = parseInt(b.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const [updated] = await db.update(featureFlags).set({ enabled: !!b.enabled, updatedBy: user.id, updatedAt: new Date() }).where(eq(featureFlags.id, id)).returning();
  await auditLog({ userId: user.id, actorEmail: user.email, action: "admin.feature_flag_update", entity: "feature_flag", entityId: id, details: { enabled: !!b.enabled, key: updated.key } });
  return NextResponse.json({ flag: updated });
}
