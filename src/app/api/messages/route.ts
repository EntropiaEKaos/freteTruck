import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, notifications } from "@/db/schema";
import { and, desc, eq, or, ilike, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const withParam = searchParams.get("with");
  const search = searchParams.get("q");

  // ===== Lista de conversas =====
  if (!withParam) {
    try {
      const query = sql`
        SELECT DISTINCT ON (other_id)
          other_id,
          other_name,
          other_company,
          other_role,
          other_verified,
          content,
          created_at,
          unread_count,
          last_sender_is_me
        FROM (
          SELECT
            CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END AS other_id,
            u.name AS other_name,
            u.company AS other_company,
            u.role AS other_role,
            u.verified AS other_verified,
            m.content AS content,
            m.created_at AS created_at,
            (SELECT COUNT(*)::int FROM messages m2
              WHERE m2.sender_id = CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END
                AND m2.receiver_id = ${user.id}
                AND m2.read = false) AS unread_count,
            CASE WHEN m.sender_id = ${user.id} THEN true ELSE false END AS last_sender_is_me
          FROM messages m
          JOIN users u ON u.id = CASE WHEN m.sender_id = ${user.id} THEN m.receiver_id ELSE m.sender_id END
          WHERE (m.sender_id = ${user.id} OR m.receiver_id = ${user.id})
          AND u.deleted_at IS NULL
          ORDER BY m.created_at DESC
        ) sub
        ORDER BY created_at DESC
        LIMIT 50
      `;

      const { rows } = await db.execute(query);

      // Buscar também usuários sem conversa iniciada (para começar nova)
      const filtered = rows as any[];
      
      // Ordenar por data
      const sorted = filtered
        .map((r: any) => ({
          other_id: Number(r.other_id),
          other_name: String(r.other_name || "Usuário"),
          other_company: r.other_company ? String(r.other_company) : null,
          other_role: r.other_role ? String(r.other_role) : "usuar",
          other_verified: !!r.other_verified,
          content: String(r.content || ""),
          created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
          unread_count: Number(r.unread_count) || 0,
          last_sender_is_me: !!r.last_sender_is_me,
        }))
        .filter((c) => c.other_id !== user.id);

      // Filtro de busca
      if (search) {
        const q = search.toLowerCase();
        return NextResponse.json({
          conversations: sorted.filter((c) => c.other_name.toLowerCase().includes(q) || (c.other_company && c.other_company.toLowerCase().includes(q))),
        });
      }

      return NextResponse.json({ conversations: sorted });
    } catch (e) {
      console.error("Error fetching conversations:", e);
      return NextResponse.json({ conversations: [] });
    }
  }

  // ===== Mensagens com um usuário específico =====
  const withUserId = parseInt(withParam, 10);
  if (Number.isNaN(withUserId) || withUserId === user.id) {
    return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
  }

  // Verificar se o outro usuário existe
  const otherUser = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, withUserId)).limit(1);
  if (otherUser.length === 0) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  // Marcar como lidas
  await db
    .update(messages)
    .set({ read: true })
    .where(and(eq(messages.senderId, withUserId), eq(messages.receiverId, user.id), eq(messages.read, false)));

  // Buscar mensagens
  const msgs = await db
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
    .limit(200);

  return NextResponse.json({ messages: msgs.reverse(), otherUser: otherUser[0] });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para enviar mensagens." }, { status: 401 });

  try {
    const b = await req.json();
    const receiverId = parseInt(b.receiverId, 10);
    const content = String(b.content || "").trim();
    const freightId = b.freightId ? parseInt(b.freightId, 10) : null;

    if (Number.isNaN(receiverId)) return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
    if (receiverId === user.id) return NextResponse.json({ error: "Não pode enviar mensagem para si mesmo." }, { status: 400 });
    if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
    if (content.length > 2000) return NextResponse.json({ error: "Mensagem muito longa (máx 2000)." }, { status: 400 });

    // Verificar destinatário
    const [receiver] = await db.select().from(users).where(eq(users.id, receiverId)).limit(1);
    if (!receiver) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const [msg] = await db.insert(messages).values({
      senderId: user.id,
      receiverId,
      freightId,
      content,
    }).returning();

    // Notificar destinatário
    await db.insert(notifications).values({
      userId: receiverId,
      type: "message",
      title: `Nova mensagem de ${user.name}`,
      body: content.substring(0, 120),
      link: `/chat?with=${user.id}`,
    });

    await auditLog({
      userId: user.id,
      actorEmail: user.email,
      action: "message.send",
      entity: "message",
      entityId: msg.id,
      details: { to: receiver.email },
    });

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (e) {
    console.error("Error sending message:", e);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();
  const Id = parseInt(b.id, 10);
  if (Number.isNaN(Id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  // Apenas o autorem pode editar, e deve ser recente (max 15 min)
  const rows = await db.select().from(messages).where(eq(messages.id, Id)).limit(1);
  const msg = rows[0];
  if (!msg) return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  if (msg.senderId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const ageMs = Date.now() - new Date(msg.createdAt).getTime();
  if (ageMs > 15 * 60 * 1000) return NextResponse.json({ error: "Só é possível editar mensagens com menos de 15 minutos." }, { status: 400 });

  const content = String(b.content || "").trim();
  if (!content) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const [updated] = await db.update(messages).set({ content }).where(eq(messages.id, Id)).returning();
  return NextResponse.json({ message: updated });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const Id = parseInt(searchParams.get("id") || "", 10);
  if (Number.isNaN(Id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const rows = await db.select().from(messages).where(eq(messages.id, Id)).limit(1);
  const msg = rows[0];
  if (!msg) return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  if (msg.senderId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await db.delete(messages).where(eq(messages.id, Id));
  return NextResponse.json({ ok: true });
}
