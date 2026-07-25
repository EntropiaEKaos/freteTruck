import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { id } = await params;
  const b = await req.json();
  if (!["aprovado", "rejeitado"].includes(b.status)) return NextResponse.json({ error: "Status inválido." }, { status: 400 });

  const [doc] = await db.update(documents).set({
    status: b.status,
    reviewComment: b.comment || null,
    reviewedBy: admin.id,
    reviewedAt: new Date(),
  }).where(eq(documents.id, parseInt(id))).returning();

  // If approved AND all docs for this user are approved → verify user
  if (b.status === "aprovado") {
    const allDocs = await db.select().from(documents).where(eq(documents.userId, doc.userId));
    if (allDocs.length > 0 && allDocs.every((d) => d.status === "aprovado")) {
      await db.update(users).set({ verified: true }).where(eq(users.id, doc.userId));
    }
  }

  return NextResponse.json({ document: doc });
}
