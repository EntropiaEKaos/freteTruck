import { NextResponse } from "next/server";
import { db } from "@/db";
import { insuranceQuotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const quotes = await db.select().from(insuranceQuotes).where(eq(insuranceQuotes.userId, user.id)).limit(20);
  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const b = await req.json();
  const cargoValue = parseFloat(b.cargoValue) || 0;
  const distanceKm = parseInt(b.distanceKm, 10) || 0;
  const freightId = b.freightId ? parseInt(b.freightId, 10) : null;
  const coverage = b.coverage || "basico";

  const baseRates: Record<string, number> = { basico: 0.15, completo: 0.35, premium: 0.6 };
  const rate = baseRates[coverage] || 0.15;
  const distanceFactor = distanceKm > 0 ? (1 + distanceKm / 10000) : 1;
  const premium = Math.round((cargoValue / 1000 * rate * distanceFactor) * 100) / 100;

  if (premium <= 0) return NextResponse.json({ error: "Valores invalidos." }, { status: 400 });

  const [quote] = await db.insert(insuranceQuotes).values({
    freightId: freightId || 0, userId: user.id,
    cargoValue: String(cargoValue), distanceKm,
    premium: String(premium), coverage,
  }).returning();

  return NextResponse.json({ quote }, { status: 201 });
}
