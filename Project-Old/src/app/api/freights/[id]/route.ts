import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const freightId = parseInt(id, 10);
  if (Number.isNaN(freightId)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  await db
    .update(freights)
    .set({ views: sql`${freights.views} + 1` })
    .where(eq(freights.id, freightId));

  const rows = await db
    .select({ freight: freights, ownerName: users.name, ownerCompany: users.company })
    .from(freights)
    .innerJoin(users, eq(freights.userId, users.id))
    .where(eq(freights.id, freightId))
    .limit(1);

  if (rows.length === 0) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const freightId = parseInt(id, 10);
  const rows = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  const freight = rows[0];
  if (!freight) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
  if (freight.userId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const b = await req.json();
  const updates: Partial<typeof freights.$inferInsert> = {};
  if (b.status && ["ativo", "fechado"].includes(b.status)) updates.status = b.status;
  if (b.price !== undefined) updates.price = b.price ? String(b.price) : null;
  if (b.description !== undefined) updates.description = b.description;

  // Edição completa do frete (dono apenas, frete ainda ativo)
  if (b.cargoType !== undefined) updates.cargoType = String(b.cargoType).trim();
  if (b.originCity !== undefined) updates.originCity = String(b.originCity).trim();
  if (b.originState !== undefined) updates.originState = b.originState;
  if (b.destCity !== undefined) updates.destCity = String(b.destCity).trim();
  if (b.destState !== undefined) updates.destState = b.destState;
  if (b.distanceKm !== undefined) updates.distanceKm = b.distanceKm ? parseInt(b.distanceKm, 10) : null;
  if (b.weightKg !== undefined) updates.weightKg = parseInt(b.weightKg, 10);
  if (b.priceType !== undefined && ["total", "tonelada", "combinar"].includes(b.priceType)) updates.priceType = b.priceType;
  if (b.vehicleTypes !== undefined) updates.vehicleTypes = Array.isArray(b.vehicleTypes) ? b.vehicleTypes.join(",") : String(b.vehicleTypes);
  if (b.bodyTypes !== undefined) updates.bodyTypes = Array.isArray(b.bodyTypes) ? b.bodyTypes.join(",") : String(b.bodyTypes);
  if (b.needsTracker !== undefined) updates.needsTracker = !!b.needsTracker;
  if (b.needsTarp !== undefined) updates.needsTarp = !!b.needsTarp;
  if (b.toll !== undefined) updates.toll = !!b.toll;
  if (b.loadDate !== undefined) updates.loadDate = b.loadDate || null;
  if (b.contactName !== undefined) updates.contactName = String(b.contactName).trim();
  if (b.contactPhone !== undefined) updates.contactPhone = String(b.contactPhone).replace(/\D/g, "");
  if (b.minPrice !== undefined) updates.minPrice = b.minPrice ? String(b.minPrice) : null;
  if (b.recurringFrequency !== undefined) updates.recurringFrequency = b.recurringFrequency || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const [updated] = await db.update(freights).set(updates).where(eq(freights.id, freightId)).returning();

  const { auditLog } = await import("@/lib/audit");
  const isFullEdit = !b.status || Object.keys(updates).length > 1;
  await auditLog({
    userId: user.id, actorEmail: user.email,
    action: isFullEdit ? "freight.update" : "freight.close",
    entity: "freight", entityId: freightId,
    details: { changedFields: Object.keys(updates) },
  });

  return NextResponse.json({ freight: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const freightId = parseInt(id, 10);
  const rows = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  const freight = rows[0];
  if (!freight) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
  if (freight.userId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await db.delete(freights).where(eq(freights.id, freightId));
  return NextResponse.json({ ok: true });
}
