import { NextResponse } from "next/server";
import { db } from "@/db";
import { truckCoupons, userCoupons } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { creditTrucks } from "@/lib/trucks";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para resgatar cupons." }, { status: 401 });

  const { code } = await req.json().catch(() => ({}));
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Código do cupom inválido." }, { status: 400 });
  }

  const cleanCode = code.trim().toUpperCase();

  const [coupon] = await db
    .select()
    .from(truckCoupons)
    .where(and(eq(truckCoupons.code, cleanCode), eq(truckCoupons.active, true)))
    .limit(1);

  if (!coupon) {
    return NextResponse.json({ error: "Cupom não encontrado ou inativo." }, { status: 404 });
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "Este cupom atingiu o limite máximo de resgates." }, { status: 410 });
  }

  const [alreadyUsed] = await db
    .select()
    .from(userCoupons)
    .where(and(eq(userCoupons.userId, user.id), eq(userCoupons.couponId, coupon.id)))
    .limit(1);

  if (alreadyUsed) {
    return NextResponse.json({ error: "Você já resgatou este cupom!" }, { status: 409 });
  }

  // Resgatar cupom na transação
  await db.insert(userCoupons).values({
    userId: user.id,
    couponId: coupon.id,
  });

  await db
    .update(truckCoupons)
    .set({ usedCount: sql`${truckCoupons.usedCount} + 1` })
    .where(eq(truckCoupons.id, coupon.id));

  const wallet = await creditTrucks({
    userId: user.id,
    amount: coupon.trucks,
    type: "bonus",
    description: `Resgate do cupom ${cleanCode}`,
    referenceType: "coupon",
    referenceId: coupon.id,
  });

  await auditLog({
    userId: user.id,
    actorEmail: user.email,
    action: "wallet.coupon_redeem",
    entity: "truck_coupon",
    entityId: coupon.id,
    details: { code: cleanCode, trucks: coupon.trucks },
  });

  return NextResponse.json({
    ok: true,
    message: `🎉 Parabéns! ${coupon.trucks} Trucks creditados na sua carteira.`,
    wallet,
  });
}
