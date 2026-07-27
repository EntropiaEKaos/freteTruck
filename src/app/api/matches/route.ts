import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { calculateOpportunityScore } from "@/lib/freight-score";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para ver oportunidades personalizadas." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") || 30)));
  const minimumScore = Math.max(0, Math.min(100, Number(searchParams.get("minScore") || 0)));

  const rows = await db
    .select({
      freight: freights,
      ownerName: users.name,
      ownerCompany: users.company,
      ownerVerified: users.verified,
    })
    .from(freights)
    .innerJoin(users, eq(freights.userId, users.id))
    .where(eq(freights.status, "ativo"))
    .orderBy(desc(freights.featured), desc(freights.createdAt))
    .limit(200);

  const profile = {
    state: user.state,
    vehicleType: user.vehicleType,
    bodyType: user.bodyType,
  };

  const opportunities = rows
    .filter((row) => row.freight.userId !== user.id)
    .map((row) => ({
      ...row,
      opportunity: calculateOpportunityScore(row.freight, row.ownerVerified, profile),
    }))
    .filter((row) => row.opportunity.score >= minimumScore)
    .sort((a, b) => {
      if (b.opportunity.score !== a.opportunity.score) return b.opportunity.score - a.opportunity.score;
      return new Date(b.freight.createdAt).getTime() - new Date(a.freight.createdAt).getTime();
    })
    .slice(0, limit);

  return NextResponse.json({
    profile,
    total: opportunities.length,
    opportunities,
    generatedAt: new Date().toISOString(),
  });
}
