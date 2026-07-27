import { NextResponse } from "next/server";
import { db } from "@/db";
import { posts, mediaUploads, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "recentes"; // recentes | populares
  const conditions = category ? [eq(posts.category, category)] : [];

  const user = await getCurrentUser();

  const result = await db
    .select({
      post: posts,
      authorName: users.name,
      authorRole: users.role,
      authorVerified: users.verified,
      likeCount: sql<number>`(SELECT count(*)::int FROM post_likes pl WHERE pl.post_id = ${posts.id})`,
      liked: user
        ? sql<boolean>`EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = ${posts.id} AND pl.user_id = ${user.id})`
        : sql<boolean>`false`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(...conditions))
    .orderBy(sort === "populares" ? desc(posts.likes) : desc(posts.createdAt))
    .limit(50);

  return NextResponse.json({ posts: result });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const b = await req.json();
  if (!b.title?.trim() || !b.content?.trim()) return NextResponse.json({ error: "Titulo e conteudo obrigatorios." }, { status: 400 });
  if (!["dica", "alerta", "diesel", "rodovia", "mercado"].includes(b.category)) return NextResponse.json({ error: "Categoria invalida." }, { status: 400 });

  let imageUrl: string | null = null;
  if (b.imageData && typeof b.imageData === "string" && b.imageData.startsWith("data:image/")) {
    try {
      const m = b.imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (m) {
        const mimeType = `image/${m[1]}`;
        const ext = m[1] === "png" ? "png" : m[1] === "webp" ? "webp" : "jpg";
        const buf = Buffer.from(m[2], "base64");
        if (buf.length <= 4 * 1024 * 1024) {
          const filename = `post_${user.id}_${Date.now()}.${ext}`;
          // 1. Salvar no PostgreSQL
          await db.insert(mediaUploads).values({
            filename,
            mimeType,
            dataBase64: b.imageData,
          });
          imageUrl = `/api/uploads/${filename}`;

          // 2. Tentar salvar no disco local (fallback dev)
          try {
            const { writeFileSync, mkdirSync, existsSync } = await import("fs");
            const { join } = await import("path");
            const dir = join(process.cwd(), "public", "uploads");
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            writeFileSync(join(dir, filename), buf);
          } catch {}
        }
      }
    } catch (e) {
      console.error("post image upload error:", e);
    }
  }

  const [post] = await db.insert(posts).values({
    authorId: user.id, title: b.title.trim(), content: b.content.trim(),
    category: b.category, city: b.city?.trim() || null, state: b.state || null,
    imageUrl,
  }).returning();

  return NextResponse.json({ post }, { status: 201 });
}
