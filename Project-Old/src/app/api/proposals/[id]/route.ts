import { NextResponse } from "next/server";
import { db } from "@/db";
import { proposals, freights, notifications, users } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { sendProposalAcceptedEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const proposalId = parseInt(id, 10);
  const rows = await db
    .select({ proposal: proposals, freight: freights })
    .from(proposals)
    .innerJoin(freights, eq(proposals.freightId, freights.id))
    .where(eq(proposals.id, proposalId))
    .limit(1);

  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  if (row.freight.userId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const b = await req.json();
  if (!["aceita", "recusada"].includes(b.status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const [updated] = await db.update(proposals).set({ status: b.status }).where(eq(proposals.id, proposalId)).returning();

  // Notificar motorista
  const route = `${row.freight.originCity}/${row.freight.originState} → ${row.freight.destCity}/${row.freight.destState}`;
  if (b.status === "aceita") {
    await db.update(freights).set({ status: "fechado" }).where(eq(freights.id, row.freight.id));
    await db
      .update(proposals)
      .set({ status: "recusada" })
      .where(and(eq(proposals.freightId, row.freight.id), ne(proposals.id, proposalId), eq(proposals.status, "pendente")));

    await db.insert(notifications).values({
      userId: row.proposal.driverId,
      type: "proposal_accepted",
      title: "🎉 Proposta aceita!",
      body: `Sua proposta para ${route} foi aceita por ${user.name}. Fale pelo chat!`,
      link: `/fretes/${row.freight.id}`,
    });

    await auditLog({ userId: user.id, actorEmail: user.email, action: "proposal.accept", entity: "freight", entityId: row.freight.id, details: { proposalId, driverId: row.proposal.driverId } });

    // E-mail profissional para o motorista com o contato do embarcador
    const [driver] = await db.select().from(users).where(eq(users.id, row.proposal.driverId)).limit(1);
    if (driver?.email) {
      sendProposalAcceptedEmail(driver.email, driver.name, route, row.freight.contactName, row.freight.contactPhone).catch(() => {});
    }
  } else {
    await auditLog({ userId: user.id, actorEmail: user.email, action: "proposal.reject", entity: "freight", entityId: row.freight.id, details: { proposalId } });
    await db.insert(notifications).values({
      userId: row.proposal.driverId,
      type: "proposal_rejected",
      title: "Proposta recusada",
      body: `Sua proposta para ${route} foi recusada.`,
      link: `/fretes/${row.freight.id}`,
    });
  }

  return NextResponse.json({ proposal: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const proposalId = parseInt(id, 10);
  const rows = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
  const proposal = rows[0];
  if (!proposal) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  if (proposal.driverId !== user.id) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  await db.delete(proposals).where(eq(proposals.id, proposalId));
  return NextResponse.json({ ok: true });
}
