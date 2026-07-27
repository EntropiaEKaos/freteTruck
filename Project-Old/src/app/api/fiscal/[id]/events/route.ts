import { NextResponse } from "next/server";
import { db } from "@/db";
import { fiscalEvents, fiscalDocuments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const docId = parseInt(id, 10);

  const docRows = await db.select().from(fiscalDocuments).where(eq(fiscalDocuments.id, docId)).limit(1);
  const doc = docRows[0];
  if (!doc) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  if (doc.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const events = await db
    .select()
    .from(fiscalEvents)
    .where(eq(fiscalEvents.fiscalId, docId))
    .orderBy(desc(fiscalEvents.createdAt));

  return NextResponse.json({ events });
}
