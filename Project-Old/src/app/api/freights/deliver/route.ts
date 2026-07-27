import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { freightId } = await req.json();
  const fid = parseInt(freightId, 10);
  if (Number.isNaN(fid)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const [f] = await db.select().from(freights).where(eq(freights.id, fid)).limit(1);
  if (!f) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
  if (f.userId !== user.id && f.delivered) return NextResponse.json({ error: "Sem permissão ou já entregue." }, { status: 400 });

  await db.update(freights).set({ delivered: true, deliveredAt: new Date(), deliveredBy: user.id }).where(eq(freights.id, fid));

  await db.insert(notifications).values({
    userId: f.userId,
    type: "delivery",
    title: "✅ Entrega confirmada",
    body: `${user.name} confirmou a entrega do frete ${f.originCity}/${f.originState} → ${f.destCity}/${f.destState}`,
    link: `/comprovante/${fid}`,
  });

  return NextResponse.json({ ok: true });
}
