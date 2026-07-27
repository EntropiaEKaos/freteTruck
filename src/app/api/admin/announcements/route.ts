import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemAnnouncements } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
  const rows = await db.select().from(systemAnnouncements).orderBy(desc(systemAnnouncements.createdAt)).limit(100);
  return NextResponse.json({ announcements: rows });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const b = await req.json();
  if (!b.title?.trim() || !b.message?.trim()) return NextResponse.json({ error: "Título e mensagem são obrigatórios." }, { status: 400 });

  const [created] = await db.insert(systemAnnouncements).values({
    title: b.title.trim(),
    message: b.message.trim(),
    variant: ["info", "success", "warning", "danger"].includes(b.variant) ? b.variant : "info",
    linkLabel: b.linkLabel?.trim() || null,
    linkUrl: b.linkUrl?.trim() || null,
    active: b.active !== false,
    startsAt: b.startsAt ? new Date(b.startsAt) : new Date(),
    endsAt: b.endsAt ? new Date(b.endsAt) : null,
    createdBy: admin.id,
  }).returning();

  await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.announcement_create", entity: "system_announcement", entityId: created.id });
  return NextResponse.json({ announcement: created }, { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const b = await req.json();
  const id = parseInt(b.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const updates: Partial<typeof systemAnnouncements.$inferInsert> = { updatedAt: new Date() };
  if (b.title !== undefined) updates.title = String(b.title).trim();
  if (b.message !== undefined) updates.message = String(b.message).trim();
  if (b.variant !== undefined) updates.variant = b.variant;
  if (b.linkLabel !== undefined) updates.linkLabel = b.linkLabel || null;
  if (b.linkUrl !== undefined) updates.linkUrl = b.linkUrl || null;
  if (b.active !== undefined) updates.active = !!b.active;
  if (b.startsAt !== undefined) updates.startsAt = b.startsAt ? new Date(b.startsAt) : new Date();
  if (b.endsAt !== undefined) updates.endsAt = b.endsAt ? new Date(b.endsAt) : null;

  const [updated] = await db.update(systemAnnouncements).set(updates).where(eq(systemAnnouncements.id, id)).returning();
  return NextResponse.json({ announcement: updated });
}
