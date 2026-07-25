import { NextResponse } from "next/server";
import { db } from "@/db";
import { truckProducts, subscriptionPlans } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const [products, plans] = await Promise.all([
    db.select().from(truckProducts).where(eq(truckProducts.active, true)).orderBy(asc(truckProducts.sortOrder)),
    db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true)).orderBy(asc(subscriptionPlans.priceCents)),
  ]);
  return NextResponse.json({ products, plans });
}
