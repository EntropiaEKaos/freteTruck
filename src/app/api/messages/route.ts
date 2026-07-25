import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, notifications } from "@/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withUserId = parseInt(searchParams.get("with") || "", 10);

  if (!Number.isNaN(withUserId) && withUserId > 0) {
    // Conversa com um usuário específico
    const rows = await db
      .select({ message: messages, senderName: users.name })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, user.id), eq(messages.receiverId, withUserId)),
          and(eq(messages.senderId, withUserId), eq(messages.receiverId, user.id))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    // Marcar como lidas
    await db
      .update(messages)
      .set({ read: true })
      .where(and(eq(messages.senderId, withUserId), eq(messages.receiverId, user.id), eq(messages.read, false)));

    return NextResponse.json({ messages: rows.reverse() });
  }

  // Lista de conversas (últimas mensagens com cada pessoa)
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (other_id) 
      m.*,
      u.name as other_name,
      u.company as other_company,
      u.role as other_role,
      CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END as other_id,
      (SELECT COUNT(*)::int FROM messages m2 
       WHERE m2.sender_id = CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END
       AND m2.receiver_id = ${user.id} AND m2.read = false) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ${user.id} OR m.receiver_id = ${user.id}
    ORDER BY other_id, m.created_at DESC
  `);

  return NextResponse.json({ conversations: rows.rows || [] });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para enviar mensagens." }, { status: 401 });

  const b = await req.json();
  const receiverId = parseInt(b.receiverId, 10);
  const content = b.content?.trim();
  const freightId = b.freightId ? parseInt(b.freightId, 10) : null;

  if (Number.isNaN(receiverId) || receiverId === user.id) {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }
  if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const [msg] = await db
    .insert(messages)
    .values({ senderId: user.id, receiverId, freightId, content })
    .returning();

  // Criar notificação
  await db.insert(notifications).values({
    userId: receiverId,
    type: "message",
    title: `Nova mensagem de ${user.name}`,
    body: content.substring(0, 100),
    link: `/chat?with=${user.id}`,
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
