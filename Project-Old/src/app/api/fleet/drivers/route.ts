import { NextResponse } from "next/server";
import { db } from "@/db";
import { fleetDrivers, fleets, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();
  const fleetId = parseInt(b.fleetId, 10);
  const driverEmail = b.driverEmail?.trim().toLowerCase();
  const plateNumber = b.plateNumber?.trim() || null;
  const vehicleType = b.vehicleType || null;

  if (Number.isNaN(fleetId) || !driverEmail) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  // Verify fleet ownership
  const [fleet] = await db.select().from(fleets).where(and(eq(fleets.id, fleetId), eq(fleets.ownerId, user.id))).limit(1);
  if (!fleet) return NextResponse.json({ error: "Frota não encontrada ou sem permissão." }, { status: 403 });

  // Find driver
  const [driver] = await db.select().from(users).where(eq(users.email, driverEmail)).limit(1);
  if (!driver) return NextResponse.json({ error: "Motorista não encontrado. Verifique o e-mail." }, { status: 404 });
  if (driver.role !== "motorista") return NextResponse.json({ error: "Este usuário não é motorista." }, { status: 400 });

  // Check if already in fleet
  const existing = await db.select({ id: fleetDrivers.id }).from(fleetDrivers)
    .where(and(eq(fleetDrivers.fleetId, fleetId), eq(fleetDrivers.driverId, driver.id))).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: "Motorista já está nesta frota." }, { status: 409 });

  const [added] = await db.insert(fleetDrivers).values({
    fleetId, driverId: driver.id, plateNumber, vehicleType,
  }).returning();

  return NextResponse.json({ driver: added, driverName: driver.name }, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "", 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  // Verify ownership
  const [fd] = await db.select({ fd: fleetDrivers, fleet: fleets })
    .from(fleetDrivers).innerJoin(fleets, eq(fleetDrivers.fleetId, fleets.id))
    .where(eq(fleetDrivers.id, id)).limit(1);
  if (!fd || fd.fleet.ownerId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await db.delete(fleetDrivers).where(eq(fleetDrivers.id, id));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();
  const id = parseInt(b.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const [fd] = await db.select({ fd: fleetDrivers, fleet: fleets })
    .from(fleetDrivers).innerJoin(fleets, eq(fleetDrivers.fleetId, fleets.id))
    .where(eq(fleetDrivers.id, id)).limit(1);
  if (!fd || fd.fleet.ownerId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const updates: Record<string, string> = {};
  if (b.status && ["disponivel", "em_transito", "manutencao"].includes(b.status)) updates.status = b.status;
  if (b.plateNumber !== undefined) updates.plateNumber = b.plateNumber || "";
  if (b.vehicleType !== undefined) updates.vehicleType = b.vehicleType || "";

  if (Object.keys(updates).length > 0) {
    await db.update(fleetDrivers).set(updates).where(eq(fleetDrivers.id, id));
  }

  return NextResponse.json({ ok: true });
}
