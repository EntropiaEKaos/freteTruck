import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, freights, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("ids") === "1") {
    const rows = await db.select({ freightId: favorites.freightId }).from(favorites).where(eq(favorites.userId, user.id));
    return NextResponse.json({ ids: rows.map((r) => r.freightId) });
  }

  const rows = await db
    .select({ freight: freights, ownerName: users.name, ownerCompany: users.company })
    .from(favorites)
    .innerJoin(freights, eq(favorites.freightId, freights.id))
    .innerJoin(users, eq(freights.userId, users.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));

  return NextResponse.json({ freights: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para favoritar fretes." }, { status: 401 });

  const b = await req.json();
  const freightId = parseInt(b.freightId, 10);
  if (Number.isNaN(freightId)) return NextResponse.json({ error: "Frete inválido." }, { status: 400 });

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.freightId, freightId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return NextResponse.json({ favorited: false });
  }

  await db.insert(favorites).values({ userId: user.id, freightId });
  return NextResponse.json({ favorited: true });
}
