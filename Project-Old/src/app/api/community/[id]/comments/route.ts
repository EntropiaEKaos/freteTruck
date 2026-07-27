import { NextResponse } from "next/server";
import { db } from "@/db";
import { postComments, posts, users, commentLikes } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) return NextResponse.json({ error: "Post inválido." }, { status: 400 });

  const user = await getCurrentUser();

  const rows = await db
    .select({
      comment: postComments,
      authorName: users.name,
      authorRole: users.role,
      authorVerified: users.verified,
      liked: user
        ? sql<boolean>`EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = ${postComments.id} AND cl.user_id = ${user.id})`
        : sql<boolean>`false`,
    })
    .from(postComments)
    .innerJoin(users, eq(postComments.userId, users.id))
    .where(eq(postComments.postId, postId))
    .orderBy(asc(postComments.createdAt))
    .limit(200);

  return NextResponse.json({ comments: rows });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para comentar." }, { status: 401 });

  const { id } = await params;
  const postId = parseInt(id, 10);
  const b = await req.json();
  const content = (b.content || "").trim();
  const parentId = b.parentId ? parseInt(b.parentId, 10) : null;

  if (!content) return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: "Comentário muito longo (máx 1000)." }, { status: 400 });

  const postRows = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (postRows.length === 0) return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });

  const [created] = await db
    .insert(postComments)
    .values({ postId, userId: user.id, parentId, content })
    .returning();

  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, postId));

  // Notify post author (if not commenting on own post)
  if (postRows[0].authorId !== user.id) {
    const { notifications } = await import("@/db/schema");
    await db.insert(notifications).values({
      userId: postRows[0].authorId,
      type: "comment",
      title: `💬 ${user.name} comentou no seu post`,
      body: content.slice(0, 120),
      link: `/comunidade`,
    });
  }

  return NextResponse.json({ comment: created }, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const postId = parseInt(id, 10);
  const { searchParams } = new URL(req.url);
  const commentId = parseInt(searchParams.get("commentId") || "", 10);
  if (Number.isNaN(commentId)) return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });

  const rows = await db.select().from(postComments).where(eq(postComments.id, commentId)).limit(1);
  const comment = rows[0];
  if (!comment) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (comment.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await db.delete(postComments).where(eq(postComments.id, commentId));
  await db.update(posts).set({ commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)` }).where(eq(posts.id, postId));

  return NextResponse.json({ ok: true });
}
