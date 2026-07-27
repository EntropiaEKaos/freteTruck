import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = parseInt(searchParams.get("userId") || "", 10);
  if (Number.isNaN(userId)) return NextResponse.json({ error: "userId inválido." }, { status: 400 });

  const [rows, stats] = await Promise.all([
    db
      .select({ review: reviews, authorName: users.name })
      .from(reviews)
      .innerJoin(users, eq(reviews.authorId, users.id))
      .where(eq(reviews.ratedUserId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
    db
      .select({ avgRating: avg(reviews.rating), total: count() })
      .from(reviews)
      .where(eq(reviews.ratedUserId, userId)),
  ]);

  return NextResponse.json({
    reviews: rows,
    avgRating: stats[0].avgRating ? parseFloat(stats[0].avgRating) : null,
    total: stats[0].total,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para avaliar." }, { status: 401 });

  const b = await req.json();
  const ratedUserId = parseInt(b.ratedUserId, 10);
  const rating = parseInt(b.rating, 10);

  if (Number.isNaN(ratedUserId) || ratedUserId === user.id) {
    return NextResponse.json({ error: "Você não pode avaliar a si mesmo." }, { status: 400 });
  }
  if (Number.isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Nota deve ser de 1 a 5." }, { status: 400 });
  }

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.authorId, user.id), eq(reviews.ratedUserId, ratedUserId)))
    .limit(1);

  const punctuality = b.punctuality ? parseInt(b.punctuality, 10) : null;
  const communication = b.communication ? parseInt(b.communication, 10) : null;
  const paymentSpeed = b.paymentSpeed ? parseInt(b.paymentSpeed, 10) : null;

  if (existing.length > 0) {
    const [updated] = await db
      .update(reviews)
      .set({ rating, comment: b.comment?.trim() || null, punctuality, communication, paymentSpeed })
      .where(eq(reviews.id, existing[0].id))
      .returning();
    return NextResponse.json({ review: updated });
  }

  const [created] = await db
    .insert(reviews)
    .values({ ratedUserId, authorId: user.id, rating, comment: b.comment?.trim() || null, punctuality, communication, paymentSpeed })
    .returning();

  return NextResponse.json({ review: created }, { status: 201 });
}
