import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

const STATE_LATLNG: Record<string, [number, number]> = {
  AC: [-9.97, -67.81], AL: [-9.66, -35.73], AP: [1.41, -51.77], AM: [-3.12, -59.99],
  BA: [-14.01, -42.04], CE: [-5.20, -38.53], DF: [-15.79, -47.88], ES: [-19.53, -40.63],
  GO: [-16.68, -49.26], MA: [-5.42, -44.28], MT: [-15.58, -56.07], MS: [-20.46, -54.64],
  MG: [-18.91, -43.94], PA: [-3.13, -52.27], PB: [-7.24, -36.00], PR: [-25.44, -50.03],
  PE: [-8.28, -35.98], PI: [-5.09, -42.81], RJ: [-22.90, -43.17], RN: [-5.22, -36.52],
  RS: [-30.01, -51.23], RO: [-11.45, -62.31], RR: [0.99, -60.69], SC: [-27.57, -48.61],
  SP: [-23.55, -46.63], SE: [-11.47, -37.05], TO: [-10.18, -48.33],
};

function simulateTracking(originState: string, destState: string, createdAtStr: string) {
  const createdAt = new Date(createdAtStr).getTime();
  const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);
  const origin = STATE_LATLNG[originState] || [0, 0];
  const dest = STATE_LATLNG[destState] || [0, 0];
  const progress = Math.min(elapsedHours / 4, 1);
  const lat = origin[0] + (dest[0] - origin[0]) * progress;
  const lng = origin[1] + (dest[1] - origin[1]) * progress;
  const jitterLat = Math.sin(Date.now() / 100000) * 0.3;
  const jitterLng = Math.cos(Date.now() / 80000) * 0.3;

  return {
    position: { lat: lat + jitterLat, lng: lng + jitterLng },
    progress: Math.round(progress * 100),
    origin: { state: originState, coords: origin },
    destination: { state: destState, coords: dest },
    estimatedETA: progress >= 0.95 ? "Chegando!" : `${Math.max(1, Math.round((1 - progress) * 72))}h restantes`,
    lastUpdated: new Date().toISOString(),
    speedKmh: Math.round(65 + Math.random() * 15),
  };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const rows = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  const f = rows[0];
  if (!f) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });

  const data = simulateTracking(f.originState, f.destState, f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt));

  await db.update(freights).set({
    trackingActive: true,
    trackingData: JSON.stringify(data),
  }).where(eq(freights.id, freightId));

  return NextResponse.json(data);
}
