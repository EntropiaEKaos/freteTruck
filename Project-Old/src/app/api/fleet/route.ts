import { NextResponse } from "next/server";
import { db } from "@/db";
import { fleets, fleetDrivers, users } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const myFleets = await db.select({ fleet: fleets, driverCount: count() })
    .from(fleets).leftJoin(fleetDrivers, eq(fleets.id, fleetDrivers.fleetId))
    .where(eq(fleets.ownerId, user.id))
    .groupBy(fleets.id, fleets.name, fleets.ownerId, fleets.createdAt);

  const detailedFleets = await Promise.all(myFleets.map(async (mf) => {
    const drivers = await db.select()
      .from(fleetDrivers).innerJoin(users, eq(fleetDrivers.driverId, users.id))
      .where(eq(fleetDrivers.fleetId, mf.fleet.id));

    return { fleet: mf.fleet, driverCount: mf.driverCount, drivers };
  }));

  return NextResponse.json({ fleets: detailedFleets });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: "Nome necessario." }, { status: 400 });

  const [fleet] = await db.insert(fleets).values({ ownerId: user.id, name: b.name.trim() }).returning();
  return NextResponse.json({ fleet }, { status: 201 });
}
