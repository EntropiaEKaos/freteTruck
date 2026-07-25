import { NextResponse } from "next/server";
import { db } from "@/db";
import { truckLedger, truckWallets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { ensureTruckWallet } from "@/lib/trucks";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const wallet = await ensureTruckWallet(user.id);
  const ledger = await db.select().from(truckLedger).where(eq(truckLedger.userId, user.id)).orderBy(desc(truckLedger.createdAt)).limit(100);
  return NextResponse.json({ wallet, ledger });
}
