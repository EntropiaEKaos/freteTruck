import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const rows = await db.select().from(alerts).where(eq(alerts.userId, user.id)).orderBy(desc(alerts.createdAt));
  return NextResponse.json({ alerts: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para criar alertas." }, { status: 401 });

  const b = await req.json();
  if (!b.originState && !b.destState && !b.vehicleType) {
    return NextResponse.json({ error: "Informe ao menos um critério para o alerta." }, { status: 400 });
  }

  const [created] = await db
    .insert(alerts)
    .values({
      userId: user.id,
      originState: b.originState || null,
      destState: b.destState || null,
      vehicleType: b.vehicleType || null,
    })
    .returning();

  return NextResponse.json({ alert: created }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "", 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  await db.delete(alerts).where(and(eq(alerts.id, id), eq(alerts.userId, user.id)));
  return NextResponse.json({ ok: true });
}
