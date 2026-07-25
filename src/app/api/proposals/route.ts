import { NextResponse } from "next/server";
import { db } from "@/db";
import { proposals, freights, users, notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { formatBRL } from "@/lib/constants";
import { auditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // Proposals I received (on my freights)
  if (searchParams.get("received") === "1") {
    const rows = await db
      .select({ proposal: proposals, freight: freights, driverName: users.name, driverPhone: users.phone, driverVehicle: users.vehicleType })
      .from(proposals)
      .innerJoin(freights, eq(proposals.freightId, freights.id))
      .innerJoin(users, eq(proposals.driverId, users.id))
      .where(eq(freights.userId, user.id))
      .orderBy(desc(proposals.createdAt));
    return NextResponse.json({ proposals: rows });
  }

  // Proposal I made on a specific freight
  const freightId = searchParams.get("freightId");
  if (freightId) {
    const rows = await db
      .select()
      .from(proposals)
      .where(and(eq(proposals.freightId, parseInt(freightId, 10)), eq(proposals.driverId, user.id)))
      .limit(1);
    return NextResponse.json({ proposal: rows[0] ?? null });
  }

  // My sent proposals
  const rows = await db
    .select({ proposal: proposals, freight: freights })
    .from(proposals)
    .innerJoin(freights, eq(proposals.freightId, freights.id))
    .where(eq(proposals.driverId, user.id))
    .orderBy(desc(proposals.createdAt));
  return NextResponse.json({ proposals: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para enviar uma proposta." }, { status: 401 });

  try {
    const b = await req.json();
    const freightId = parseInt(b.freightId, 10);
    if (Number.isNaN(freightId)) return NextResponse.json({ error: "Frete inválido." }, { status: 400 });

    const fRows = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
    const freight = fRows[0];
    if (!freight) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
    if (freight.userId === user.id) return NextResponse.json({ error: "Você não pode enviar proposta no seu próprio frete." }, { status: 400 });
    if (freight.status !== "ativo") return NextResponse.json({ error: "Este frete já foi fechado." }, { status: 400 });

    const existing = await db
      .select({ id: proposals.id })
      .from(proposals)
      .where(and(eq(proposals.freightId, freightId), eq(proposals.driverId, user.id)))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Você já enviou uma proposta para este frete." }, { status: 409 });
    }

    const [created] = await db
      .insert(proposals)
      .values({
        freightId,
        driverId: user.id,
        amount: b.amount ? String(b.amount) : null,
        message: b.message?.trim() || null,
      })
      .returning();

    // Notificar o dono do frete
    const route = `${freight.originCity}/${freight.originState} → ${freight.destCity}/${freight.destState}`;
    const amountStr = b.amount ? formatBRL(b.amount) : "a combinar";
    await db.insert(notifications).values({
      userId: freight.userId,
      type: "proposal_received",
      title: `📨 Nova proposta de ${user.name}`,
      body: `Frete ${route} — Valor: ${amountStr}`,
      link: `/painel`,
    });

    // Audit + e-mail profissional ao dono do frete
    await auditLog({ userId: user.id, actorEmail: user.email, action: "proposal.create", entity: "freight", entityId: freightId, details: { amount: amountStr } });
    const [owner] = await db.select().from(users).where(eq(users.id, freight.userId)).limit(1);
    if (owner?.email) {
      const { sendProposalReceivedEmail } = await import("@/lib/email");
      sendProposalReceivedEmail(owner.email, owner.name, user.name, route, freightId).catch(() => {});
    }

    return NextResponse.json({ proposal: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao enviar proposta." }, { status: 500 });
  }
}
