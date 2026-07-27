import { NextResponse } from "next/server";
import { db } from "@/db";
import { commentLikes, postComments } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const b = await req.json();
  const commentId = parseInt(b.commentId, 10);
  if (Number.isNaN(commentId)) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });

  const existing = await db
    .select({ id: commentLikes.id })
    .from(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, user.id)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(commentLikes).where(eq(commentLikes.id, existing[0].id));
    await db.update(postComments).set({ likes: sql`GREATEST(${postComments.likes} - 1, 0)` }).where(eq(postComments.id, commentId));
    return NextResponse.json({ liked: false });
  }

  await db.insert(commentLikes).values({ commentId, userId: user.id });
  await db.update(postComments).set({ likes: sql`${postComments.likes} + 1` }).where(eq(postComments.id, commentId));
  return NextResponse.json({ liked: true });
}
