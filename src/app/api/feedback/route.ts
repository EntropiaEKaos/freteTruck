import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedbackReports } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const b = await req.json();
  const message = String(b.message || "").trim();

  if (!message || message.length < 10) {
    return NextResponse.json({ error: "Descreva o feedback com pelo menos 10 caracteres." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Feedback muito longo. Máximo de 4000 caracteres." }, { status: 400 });
  }

  const type = ["bug", "ideia", "elogio", "financeiro", "fiscal", "gps", "outro"].includes(b.type) ? b.type : "bug";
  const priority = ["baixa", "normal", "alta", "critica"].includes(b.priority) ? b.priority : "normal";

  const [created] = await db.insert(feedbackReports).values({
    userId: user?.id ?? null,
    name: user?.name || b.name?.trim() || null,
    email: user?.email || b.email?.trim() || null,
    type,
    priority,
    pageUrl: b.pageUrl?.trim() || null,
    message,
    userAgent: req.headers.get("user-agent")?.slice(0, 300) || null,
  }).returning();

  await auditLog({
    userId: user?.id ?? null,
    actorEmail: user?.email ?? b.email ?? null,
    action: "feedback.create",
    entity: "feedback_report",
    entityId: created.id,
    details: { type, priority },
  });

  return NextResponse.json({ ok: true, feedback: created }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const reports = await db.select().from(feedbackReports).orderBy(desc(feedbackReports.createdAt)).limit(200);
  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const b = await req.json();
  const id = parseInt(b.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const updates: Partial<typeof feedbackReports.$inferInsert> = { updatedAt: new Date() };
  if (b.status && ["novo", "analisando", "resolvido", "arquivado"].includes(b.status)) updates.status = b.status;
  if (b.adminNote !== undefined) updates.adminNote = String(b.adminNote || "").trim() || null;
  if (b.priority && ["baixa", "normal", "alta", "critica"].includes(b.priority)) updates.priority = b.priority;

  const [updated] = await db.update(feedbackReports).set(updates).where(eq(feedbackReports.id, id)).returning();
  return NextResponse.json({ feedback: updated });
}
