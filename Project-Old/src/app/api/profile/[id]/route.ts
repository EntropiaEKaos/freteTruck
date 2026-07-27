import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, freights, reviews, proposals } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (Number.isNaN(userId)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const [activeFreights, closedFreights, reviewStats, proposalCount, recentFreights, recentReviews] = await Promise.all([
    db.select({ c: count() }).from(freights).where(and(eq(freights.userId, userId), eq(freights.status, "ativo"))),
    db.select({ c: count() }).from(freights).where(and(eq(freights.userId, userId), eq(freights.status, "fechado"))),
    db.select({ avgRating: avg(reviews.rating), total: count() }).from(reviews).where(eq(reviews.ratedUserId, userId)),
    db.select({ c: count() }).from(proposals).where(eq(proposals.driverId, userId)),
    db
      .select()
      .from(freights)
      .where(and(eq(freights.userId, userId), eq(freights.status, "ativo")))
      .orderBy(desc(freights.createdAt))
      .limit(6),
    db
      .select({ review: reviews, authorName: users.name })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(eq(reviews.ratedUserId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(5),
  ]);

  // Calcular badges
  const badges: { icon: string; label: string; color: string }[] = [];
  const avgR = reviewStats[0].avgRating ? parseFloat(reviewStats[0].avgRating) : 0;
  const totalReviews = reviewStats[0].total;
  const totalFreights = activeFreights[0].c + closedFreights[0].c;

  if (totalReviews >= 3 && avgR >= 4.5) badges.push({ icon: "⭐", label: "Top Avaliado", color: "amber" });
  if (totalFreights >= 10) badges.push({ icon: "🏅", label: "Veterano", color: "blue" });
  else if (totalFreights >= 5) badges.push({ icon: "📦", label: "Experiente", color: "emerald" });
  if (closedFreights[0].c >= 5) badges.push({ icon: "🤝", label: "Negociador", color: "purple" });
  if (proposalCount[0].c >= 10) badges.push({ icon: "🚀", label: "Ativo", color: "orange" });

  const memberDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
  if (memberDays >= 30) badges.push({ icon: "🛡️", label: "Membro verificado", color: "slate" });

  // Nível
  let level = "Iniciante";
  let levelColor = "slate";
  const score = totalFreights * 10 + totalReviews * 5 + proposalCount[0].c * 2;
  if (score >= 100) { level = "Diamante"; levelColor = "cyan"; }
  else if (score >= 50) { level = "Ouro"; levelColor = "amber"; }
  else if (score >= 20) { level = "Prata"; levelColor = "slate"; }
  else if (score >= 5) { level = "Bronze"; levelColor = "orange"; }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      company: user.company,
      city: user.city,
      state: user.state,
      vehicleType: user.vehicleType,
      bodyType: user.bodyType,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    stats: {
      activeFreights: activeFreights[0].c,
      closedFreights: closedFreights[0].c,
      avgRating: avgR,
      totalReviews,
      totalProposals: proposalCount[0].c,
    },
    badges,
    level,
    levelColor,
    recentFreights,
    recentReviews,
  });
}
