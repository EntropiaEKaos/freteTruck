import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, reviews, proposals, transactions, notifications as notifs } from "@/db/schema";
import { and, eq, sum, count, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  // Last 7 days data
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

  // Freights per day (last 7 days)
  const freightByDay = await db.execute(sql`
    SELECT date(created_at) as day, count(*)::int as total,
      sum(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END)::int as active,
      sum(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END)::int as closed
    FROM freights
    WHERE user_id = ${user.id}
    AND created_at >= ${daysAgo(7)}
    GROUP BY date(created_at) ORDER BY day
  `);

  // Top routes by revenue (price)
  const topRoutes = await db.execute(sql`
    SELECT origin_state || ' -> ' || dest_state as route,
      count(*)::int as freq,
      round(avg(price)::numeric, 2) as avg_price,
      sum(CASE WHEN price IS NOT NULL THEN price::numeric ELSE 0 END) as total_revenue
    FROM freights
    WHERE user_id = ${user.id}
    AND price IS NOT NULL
    GROUP BY origin_state, dest_state
    ORDER BY total_revenue DESC LIMIT 10
  `);

  // Proposal stats
  const proposalStats = await db.execute(sql`
    SELECT
      sum(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END)::int as pending,
      sum(CASE WHEN status = 'aceita' THEN 1 ELSE 0 END)::int as accepted,
      sum(CASE WHEN status = 'recusada' THEN 1 ELSE 0 END)::int as rejected,
      count(*)::int as total
    FROM proposals WHERE driver_id = ${user.id} OR freight_id IN (SELECT id FROM freights WHERE user_id = ${user.id})
  `);

  // Views per day
  const viewsByDay = await db.execute(sql`
    SELECT date(created_at) as day, sum(views) as total_views
    FROM freights WHERE user_id = ${user.id}
    GROUP BY date(created_at)
    ORDER BY day LIMIT 14
  `);

  // Reviews average by category
  const reviewStats = user.role === "embarcador" ? await db.execute(sql`
    SELECT round(avg(rating)::numeric, 1) as rating,
      round(avg(punctuality)::numeric, 1) as punctuality,
      round(avg(communication)::numeric, 1) as communication,
      round(avg(payment_speed)::numeric, 1) as payment_speed,
      count(*)::int as total_reviews
    FROM reviews WHERE rated_user_id = ${user.id}
  `) : null;

  // Notification count by type
  const notifByType = await db.execute(sql`
    SELECT type, count(*)::int as total FROM notifications
    WHERE user_id = ${user.id}
    GROUP BY type ORDER BY total DESC
  `);

  return NextResponse.json({
    freightByDay: freightByDay.rows.map((r: any) => ({ ...r, day: r.day.toISOString() })),
    topRoutes: topRoutes.rows,
    proposalStats: proposalStats.rows[0],
    viewsByDay: viewsByDay.rows,
    reviewStats: reviewStats?.rows[0] || null,
    notifByType: notifByType.rows,
    totalFreights: (await db.select({ c: count() }).from(freights).where(eq(freights.userId, user.id)))[0].c,
  });
}
