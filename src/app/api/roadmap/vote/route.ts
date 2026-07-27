import { NextResponse } from "next/server";
import { db } from "@/db";
import { roadmapFeatures, roadmapVotes } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para votar no roadmap." }, { status: 401 });

  const b = await req.json();
  const featureId = parseInt(b.featureId, 10);
  if (Number.isNaN(featureId)) return NextResponse.json({ error: "Feature inválida." }, { status: 400 });

  const existing = await db
    .select({ id: roadmapVotes.id })
    .from(roadmapVotes)
    .where(and(eq(roadmapVotes.featureId, featureId), eq(roadmapVotes.userId, user.id)))
    .limit(1);

  if (existing.length > 0) {
    // Retirar voto
    await db.delete(roadmapVotes).where(eq(roadmapVotes.id, existing[0].id));
    await db
      .update(roadmapFeatures)
      .set({ votesCount: sql`GREATEST(${roadmapFeatures.votesCount} - 1, 0)` })
      .where(eq(roadmapFeatures.id, featureId));
    
    await auditLog({ userId: user.id, actorEmail: user.email, action: "roadmap.unvote", entity: "roadmap_feature", entityId: featureId });
    return NextResponse.json({ voted: false });
  }

  // Adicionar voto
  await db.insert(roadmapVotes).values({ featureId, userId: user.id });
  await db
    .update(roadmapFeatures)
    .set({ votesCount: sql`${roadmapFeatures.votesCount} + 1` })
    .where(eq(roadmapFeatures.id, featureId));

  await auditLog({ userId: user.id, actorEmail: user.email, action: "roadmap.vote", entity: "roadmap_feature", entityId: featureId });
  return NextResponse.json({ voted: true });
}
