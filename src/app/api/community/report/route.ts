import { NextResponse } from "next/server";
import { db } from "@/db";
import { contentReports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const b = await req.json().catch(() => ({}));

  const targetType = b.targetType || "post";
  const targetId = parseInt(b.targetId, 10);
  const reason = String(b.reason || "").trim();
  const details = String(b.details || "").trim();

  if (Number.isNaN(targetId) || !reason) {
    return NextResponse.json({ error: "Dados da denúncia inválidos." }, { status: 400 });
  }

  const [report] = await db
    .insert(contentReports)
    .values({
      userId: user?.id || null,
      targetType,
      targetId,
      reason,
      details: details || null,
    })
    .returning();

  await auditLog({
    userId: user?.id || null,
    actorEmail: user?.email || "anonimo",
    action: "moderation.report",
    entity: "content_report",
    entityId: report.id,
    details: { targetType, targetId, reason },
  });

  return NextResponse.json({
    ok: true,
    message: "🚨 Denúncia registrada! Nossa equipe de moderação irá analisar o conteúdo.",
    report,
  });
}
