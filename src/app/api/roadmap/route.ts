import { NextResponse } from "next/server";
import { db } from "@/db";
import { roadmapFeatures, roadmapVotes } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  const rows = await db
    .select({
      feature: roadmapFeatures,
      voted: user
        ? sql<boolean>`EXISTS(SELECT 1 FROM roadmap_votes rv WHERE rv.feature_id = ${roadmapFeatures.id} AND rv.user_id = ${user.id})`
        : sql<boolean>`false`,
    })
    .from(roadmapFeatures)
    .orderBy(desc(roadmapFeatures.votesCount), desc(roadmapFeatures.createdAt))
    .limit(50);

  return NextResponse.json({ features: rows });
}
