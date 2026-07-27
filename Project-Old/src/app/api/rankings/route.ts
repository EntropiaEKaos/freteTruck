import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, freights, reviews } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

export async function GET() {
  const topEmbarcadores = await db.select({
    id: users.id, name: users.name, company: users.company, state: users.state,
    totalFreights: count(),
  }).from(users).leftJoin(freights, eq(users.id, freights.userId))
    .where(eq(users.role, "embarcador"))
    .groupBy(users.id, users.name, users.company, users.state)
    .orderBy(desc(count())).limit(10);

  const topMotoristas = await db.select({
    id: users.id, name: users.name, city: users.city, state: users.state, vehicleType: users.vehicleType,
    freightCount: count(),
  }).from(users).leftJoin(freights, eq(users.id, freights.userId))
    .where(eq(users.role, "motorista"))
    .groupBy(users.id, users.name, users.city, users.state, users.vehicleType)
    .orderBy(desc(count())).limit(10);

  const topRated = await db.select({
    id: users.id, name: users.name, role: users.role, state: users.state,
    rating: reviews.rating,
  }).from(users)
    .innerJoin(reviews, eq(users.id, reviews.ratedUserId))
    .groupBy(users.id, users.name, users.role, users.state, reviews.rating)
    .orderBy(desc(reviews.rating))
    .limit(10);

  return NextResponse.json({ topEmbarcadores, topMotoristas, topRated });
}
