import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const [userRow] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const txs = await db.select()
    .from(transactions)
    .where(eq(transactions.userId, user.id))
    .orderBy(desc(transactions.createdAt))
    .limit(30);

  return NextResponse.json({
    credits: parseFloat(userRow?.credits?.toString() || "0"),
    transactions: txs,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();
  const validTypes = ["featured", "insurance", "purchase", "admin_grant"];
  if (!validTypes.includes(b.type)) return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });

  const amount = parseFloat(b.amount);
  if (Number.isNaN(amount) || amount <= 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });

  const [current] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);
  const balance = parseFloat(current?.credits?.toString() || "0");

  // For debits, check balance
  if (b.type !== "admin_grant" && balance < amount) {
    return NextResponse.json({ error: `Saldo insuficiente. Você tem R$ ${balance.toFixed(2)}.`, status: 402 });
  }

  // Debit or credit
  const netAmount = b.type === "admin_grant" ? Math.abs(amount) : -Math.abs(amount);
  
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      credits: sql`credits + ${netAmount}`,
    }).where(eq(users.id, user.id));
    await tx.insert(transactions).values({
      userId: user.id,
      amount: String(netAmount),
      type: b.type,
      description: b.description,
      refId: b.refId ? parseInt(b.refId, 10) : null,
    });
  });

  const [updated] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, user.id)).limit(1);
  return NextResponse.json({ credits: parseFloat(updated?.credits?.toString() || "0") });
}
