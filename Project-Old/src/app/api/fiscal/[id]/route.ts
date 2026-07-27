import { NextResponse } from "next/server";
import { db } from "@/db";
import { fiscalDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const docId = parseInt(id, 10);
  const rows = await db.select().from(fiscalDocuments).where(eq(fiscalDocuments.id, docId)).limit(1);
  const doc = rows[0];
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (doc.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  return new NextResponse(doc.xmlContent || "", {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${doc.docType}_${doc.accessKey || doc.id}.xml"`,
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const docId = parseInt(id, 10);
  const { action } = await req.json();

  const rows = await db.select().from(fiscalDocuments).where(eq(fiscalDocuments.id, docId)).limit(1);
  const doc = rows[0];
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (doc.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { fiscalEvents } = await import("@/db/schema");
  const { reason } = await req.json().catch(() => ({}));

  async function logEvent(eventType: string, protocol?: string, evReason?: string) {
    await db.insert(fiscalEvents).values({
      fiscalId: docId, userId: user!.id, eventType,
      protocol: protocol || null, reason: evReason || null,
    });
  }

  if (action === "emitir") {
    if (doc.status === "autorizado_simulado") return NextResponse.json({ error: "Documento já autorizado." }, { status: 400 });
    const protocol = `135${Date.now()}${Math.floor(Math.random() * 9999)}`;
    const [updated] = await db
      .update(fiscalDocuments)
      .set({ status: "autorizado_simulado", protocol, issuedAt: new Date(), errorMessage: null })
      .where(eq(fiscalDocuments.id, docId))
      .returning();
    await logEvent("emissao", protocol);
    return NextResponse.json({ document: updated });
  }

  if (action === "cancelar") {
    if (doc.status !== "autorizado_simulado") {
      return NextResponse.json({ error: "Só é possível cancelar documento autorizado." }, { status: 400 });
    }
    if (!reason || reason.trim().length < 15) {
      return NextResponse.json({ error: "Justificativa de cancelamento deve ter no mínimo 15 caracteres (exigência SEFAZ)." }, { status: 400 });
    }
    const protocol = `110111${Date.now()}`.slice(0, 15);
    const [updated] = await db
      .update(fiscalDocuments)
      .set({ status: "cancelado", errorMessage: `Cancelado: ${reason.trim()}` })
      .where(eq(fiscalDocuments.id, docId))
      .returning();
    await logEvent("cancelamento", protocol, reason.trim());
    return NextResponse.json({ document: updated });
  }

  if (action === "carta_correcao") {
    if (doc.status !== "autorizado_simulado") {
      return NextResponse.json({ error: "Carta de correção só para documento autorizado." }, { status: 400 });
    }
    if (!reason || reason.trim().length < 15) {
      return NextResponse.json({ error: "Texto da correção deve ter no mínimo 15 caracteres." }, { status: 400 });
    }
    const protocol = `110110${Date.now()}`.slice(0, 15);
    await logEvent("carta_correcao", protocol, reason.trim());
    return NextResponse.json({ ok: true, protocol });
  }

  if (action === "encerrar") {
    if (doc.docType !== "mdfe") return NextResponse.json({ error: "Encerramento é exclusivo do MDF-e." }, { status: 400 });
    if (doc.status !== "autorizado_simulado") return NextResponse.json({ error: "MDF-e precisa estar autorizado para encerrar." }, { status: 400 });
    const protocol = `132${Date.now()}`.slice(0, 15);
    const [updated] = await db
      .update(fiscalDocuments)
      .set({ status: "encerrado_simulado" })
      .where(eq(fiscalDocuments.id, docId))
      .returning();
    await logEvent("encerramento", protocol, reason?.trim() || "Encerramento após fim da viagem.");
    return NextResponse.json({ document: updated });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
