import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);

  if (searchParams.get("count") === "1") {
    const [row] = await db
      .select({ c: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return NextResponse.json({ count: row.c });
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  return NextResponse.json({ notifications: rows });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();

  if (b.readAll) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return NextResponse.json({ ok: true });
  }

  const id = parseInt(b.id, 10);
  if (!Number.isNaN(id)) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
  }

  return NextResponse.json({ ok: true });
}
