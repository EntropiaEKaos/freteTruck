import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, freights, documents, transactions, proposals, reviews, notifications as notifs } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const [userStats, freightStats, docStats, txStats] = await Promise.all([
    // Users
    Promise.all([
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(users).where(eq(users.role, "motorista")),
      db.select({ c: count() }).from(users).where(eq(users.role, "embarcador")),
      db.select({ c: count() }).from(users).where(eq(users.verified, true)),
    ]),
    // Freights
    Promise.all([
      db.select({ c: count() }).from(freights),
      db.select({ c: count() }).from(freights).where(eq(freights.status, "ativo")),
      db.select({ c: count() }).from(freights).where(eq(freights.status, "fechado")),
      db.select({ c: count() }).from(freights).where(eq(freights.isAuction, true)),
    ]),
    // Documents
    db.select({ c: count() }).from(documents).where(eq(documents.status, "pendente")),
    // Transactions
    db.select({ c: count() }).from(transactions),
  ]);

  const recentUsers = await db.select().from(users)
    .orderBy(desc(users.createdAt)).limit(10);

  return NextResponse.json({
    stats: {
      totalUsers: userStats[0][0].c,
      motoristas: userStats[1][0].c,
      embarcadores: userStats[2][0].c,
      verifiedUsers: userStats[3][0].c,
      totalFreights: freightStats[0][0].c,
      activeFreights: freightStats[1][0].c,
      closedFreights: freightStats[2][0].c,
      auctions: freightStats[3][0].c,
      pendingDocs: docStats[0].c,
      totalTransactions: txStats[0].c,
    },
    recentUsers,
  });
}
