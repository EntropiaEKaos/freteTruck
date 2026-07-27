import { NextResponse } from "next/server";
import { db } from "@/db";
import { postLikes, posts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const b = await req.json();
  const postId = parseInt(b.postId, 10);
  if (Number.isNaN(postId)) return NextResponse.json({ error: "Post invalido." }, { status: 400 });

  const existing = await db.select({ id: postLikes.id }).from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id))).limit(1);

  if (existing.length > 0) {
    await db.delete(postLikes).where(eq(postLikes.id, existing[0].id));
    await db.update(posts).set({ likes: sql`${posts.likes} - 1` }).where(eq(posts.id, postId));
    return NextResponse.json({ liked: false });
  }

  await db.insert(postLikes).values({ postId, userId: user.id });
  await db.update(posts).set({ likes: sql`${posts.likes} + 1` }).where(eq(posts.id, postId));
  return NextResponse.json({ liked: true });
}
