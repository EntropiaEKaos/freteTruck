import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights } from "@/db/schema";
import { and, avg, count, eq, isNotNull, ilike, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const originState = searchParams.get("originState") || "";
  const destState = searchParams.get("destState") || "";
  const cargoType = searchParams.get("cargoType") || "";
  const distanceKm = parseInt(searchParams.get("distanceKm") || "0", 10);
  const weightKg = parseInt(searchParams.get("weightKg") || "0", 10);
  const vehicleType = searchParams.get("vehicleType") || "";

  const conditions = [eq(freights.status, "ativo"), isNotNull(freights.price), isNotNull(freights.distanceKm)];
  if (originState) conditions.push(eq(freights.originState, originState));
  if (destState) conditions.push(eq(freights.destState, destState));
  if (cargoType) conditions.push(ilike(freights.cargoType, `%${cargoType}%`));
  if (vehicleType) conditions.push(ilike(freights.vehicleTypes, `%${vehicleType}%`));

  const results = await db.select({
    avgPrice: avg(freights.price),
    minPrice: sql<number>`min(${freights.price}::numeric)`,
    maxPrice: sql<number>`max(${freights.price}::numeric)`,
    avgDistance: avg(freights.distanceKm),
    avgWeight: avg(freights.weightKg),
    totalFreights: count(),
  }).from(freights).where(and(...conditions));

  const data = results[0];
  const avgPrice = data.avgPrice ? parseFloat(data.avgPrice.toString()) : 0;
  const minP = data.minPrice || 0;
  const maxP = data.maxPrice || 0;
  const avgDist = data.avgDistance ? parseFloat(data.avgDistance.toString()) : 0;
  const avgWt = data.avgWeight ? parseFloat(data.avgWeight.toString()) : 30000;
  const totalFreights = data.totalFreights;

  let suggestedPrice = avgPrice || 7000;
  let perKm = avgDist > 0 ? avgPrice / avgDist : 7;
  let confidence = "baixa";
  const factors: { label: string; impact: string; icon: string }[] = [];

  if (distanceKm > 0) {
    if (distanceKm > avgDist * 1.3) { perKm *= 0.92; factors.push({ label: "Rota longa", impact: "-8% R$/km (economia de escala)", icon: "🛣️" }); }
    else if (distanceKm > avgDist * 1.1) { perKm *= 0.96; factors.push({ label: "Rota media-longa", impact: "-4% R$/km", icon: "🛣️" }); }
    else if (distanceKm < avgDist * 0.5) { perKm *= 1.15; factors.push({ label: "Rota curta", impact: "+15% R$/km (custo fixo alto)", icon: "🏁" }); }
    suggestedPrice = distanceKm * perKm;
  }

  if (weightKg > 0) {
    if (weightKg > avgWt * 1.2) { suggestedPrice *= 1.1; factors.push({ label: "Carga pesada", impact: "+10% (maior desgaste)", icon: "⚖️" }); }
    else if (weightKg < avgWt * 0.5) { suggestedPrice *= 0.85; factors.push({ label: "Carga leve", impact: "-15% (menor consumo)", icon: "🪶" }); }
  }

  const month = new Date().getMonth();
  if ([2, 3, 4, 5].includes(month)) {
    const hs = (month === 4 || month === 5) ? 1.15 : 1.05;
    if (cargoType.toLowerCase().includes("soja") || cargoType.toLowerCase().includes("grao")) {
      suggestedPrice *= hs; factors.push({ label: "Safra", impact: `+${((hs - 1) * 100).toFixed(0)}% (alta demanda)`, icon: "🌾" });
    }
  }
  if ([12, 1].includes(month)) { suggestedPrice *= 0.92; factors.push({ label: "Feriados", impact: "-8% (mais motoristas)", icon: "🎄" }); }

  if (totalFreights >= 10) confidence = "alta";
  else if (totalFreights >= 5) confidence = "media";
  else if (totalFreights >= 1) confidence = "baixa";

  return NextResponse.json({
    suggestedPrice: Math.round(suggestedPrice),
    floorPrice: Math.round(suggestedPrice * 0.8),
    ceilingPrice: Math.round(suggestedPrice * 1.2),
    avgMarketPrice: Math.round(avgPrice),
    perKm: perKm.toFixed(2),
    confidence,
    sampleSize: totalFreights,
    minMarket: Math.round(minP),
    maxMarket: Math.round(maxP),
    factors,
    recommendation: totalFreights === 0 ? "Sem dados suficientes. Use media de R$7/km como referencia." :
      suggestedPrice > avgPrice * 1.05 ? "Valor acima da media! Boa margem!" :
      suggestedPrice < avgPrice * 0.95 ? "Abaixo da media. Avalie custos." : "Dentro da faixa de mercado!",
  });
}
