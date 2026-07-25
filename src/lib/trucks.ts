import { db } from "@/db";
import { truckLedger, truckWallets } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

export async function ensureTruckWallet(userId: number) {
  await db.insert(truckWallets).values({ userId }).onConflictDoNothing({ target: truckWallets.userId });
  const rows = await db.select().from(truckWallets).where(eq(truckWallets.userId, userId)).limit(1);
  if (!rows[0]) throw new Error("Não foi possível criar carteira de Trucks.");
  return rows[0];
}

export async function getTruckWallet(userId: number) {
  return ensureTruckWallet(userId);
}

export async function creditTrucks(params: {
  userId: number;
  amount: number;
  type: string;
  description: string;
  referenceType?: string;
  referenceId?: number;
}) {
  const amount = Math.floor(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Quantidade de Trucks inválida.");

  return db.transaction(async (tx) => {
    await tx.insert(truckWallets).values({ userId: params.userId }).onConflictDoNothing({ target: truckWallets.userId });
    const [wallet] = await tx.select().from(truckWallets).where(eq(truckWallets.userId, params.userId)).limit(1);
    if (!wallet) throw new Error("Carteira não encontrada.");

    const [updated] = await tx.update(truckWallets).set({
      balance: sql`${truckWallets.balance} + ${amount}`,
      lifetimeEarned: sql`${truckWallets.lifetimeEarned} + ${amount}`,
      updatedAt: new Date(),
    }).where(eq(truckWallets.id, wallet.id)).returning();

    await tx.insert(truckLedger).values({
      walletId: wallet.id,
      userId: params.userId,
      amount,
      balanceAfter: updated.balance,
      type: params.type,
      description: params.description,
      referenceType: params.referenceType || null,
      referenceId: params.referenceId || null,
    });

    return updated;
  });
}

export async function debitTrucks(params: {
  userId: number;
  amount: number;
  type: string;
  description: string;
  referenceType?: string;
  referenceId?: number;
}) {
  const amount = Math.floor(params.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Quantidade de Trucks inválida.");

  return db.transaction(async (tx) => {
    await tx.insert(truckWallets).values({ userId: params.userId }).onConflictDoNothing({ target: truckWallets.userId });
    const [updated] = await tx.update(truckWallets).set({
      balance: sql`${truckWallets.balance} - ${amount}`,
      lifetimeSpent: sql`${truckWallets.lifetimeSpent} + ${amount}`,
      updatedAt: new Date(),
    }).where(and(eq(truckWallets.userId, params.userId), gte(truckWallets.balance, amount))).returning();

    if (!updated) {
      throw new Error("Saldo de Trucks insuficiente.");
    }

    await tx.insert(truckLedger).values({
      walletId: updated.id,
      userId: params.userId,
      amount: -amount,
      balanceAfter: updated.balance,
      type: params.type,
      description: params.description,
      referenceType: params.referenceType || null,
      referenceId: params.referenceId || null,
    });

    return updated;
  });
}
