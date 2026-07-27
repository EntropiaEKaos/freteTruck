import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, trackingPositions, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Motorista envia posição GPS real */
export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) return NextResponse.json({ error: "Frete inválido." }, { status: 400 });

  const b = await req.json();
  const lat = parseFloat(b.lat);
  const lng = parseFloat(b.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  const [freight] = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  if (!freight) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });

  const [pos] = await db
    .insert(trackingPositions)
    .values({
      freightId,
      userId: user.id,
      lat: String(lat),
      lng: String(lng),
      accuracy: b.accuracy ? String(b.accuracy) : null,
      speedKmh: b.speedKmh ? String(b.speedKmh) : null,
      heading: b.heading ? String(b.heading) : null,
      source: b.source || "gps",
    })
    .returning();

  await db.update(freights).set({ trackingActive: true }).where(eq(freights.id, freightId));

  return NextResponse.json({ ok: true, position: pos }, { status: 201 });
}

/** Histórico de posições reais do frete */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) return NextResponse.json({ error: "Frete inválido." }, { status: 400 });

  const rows = await db
    .select({ position: trackingPositions, driverName: users.name })
    .from(trackingPositions)
    .innerJoin(users, eq(trackingPositions.userId, users.id))
    .where(eq(trackingPositions.freightId, freightId))
    .orderBy(desc(trackingPositions.createdAt))
    .limit(200);

  const positions = rows.map((r) => ({
    lat: parseFloat(r.position.lat),
    lng: parseFloat(r.position.lng),
    speedKmh: r.position.speedKmh ? parseFloat(r.position.speedKmh) : null,
    accuracy: r.position.accuracy ? parseFloat(r.position.accuracy) : null,
    source: r.position.source,
    driverName: r.driverName,
    createdAt: r.position.createdAt,
  }));

  return NextResponse.json({
    positions,
    latest: positions[0] || null,
    total: positions.length,
  });
}
