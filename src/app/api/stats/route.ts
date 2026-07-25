import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights } from "@/db/schema";
import { and, avg, count, eq, isNotNull, sql } from "drizzle-orm";

export async function GET() {
  // Preço médio por rota (originState -> destState) com R$/km
  const routeStats = await db
    .select({
      originState: freights.originState,
      destState: freights.destState,
      avgPrice: avg(freights.price),
      avgDistance: avg(freights.distanceKm),
      totalFreights: count(),
    })
    .from(freights)
    .where(and(eq(freights.status, "ativo"), isNotNull(freights.price), isNotNull(freights.distanceKm)))
    .groupBy(freights.originState, freights.destState)
    .having(sql`count(*) >= 1`)
    .orderBy(sql`count(*) DESC`)
    .limit(50);

  // Fretes por estado de origem
  const byOrigin = await db
    .select({ state: freights.originState, total: count() })
    .from(freights)
    .where(eq(freights.status, "ativo"))
    .groupBy(freights.originState)
    .orderBy(sql`count(*) DESC`);

  // Fretes por estado de destino
  const byDest = await db
    .select({ state: freights.destState, total: count() })
    .from(freights)
    .where(eq(freights.status, "ativo"))
    .groupBy(freights.destState)
    .orderBy(sql`count(*) DESC`);

  return NextResponse.json({ routeStats, byOrigin, byDest });
}
