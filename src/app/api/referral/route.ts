import { NextResponse } from "next/server";
import { db } from "@/db";
import { referrals, users, monetizationSettings } from "@/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const [uRow] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const myReferrals = await db
    .select({ referral: referrals, invitedName: users.name })
    .from(referrals)
    .innerJoin(users, eq(referrals.invitedId, users.id))
    .where(eq(referrals.inviterId, user.id))
    .orderBy(referrals.createdAt)
    .limit(20);

  const [stats, rewardSetting] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(referrals).where(and(eq(referrals.inviterId, user.id), eq(referrals.status, "confirmed"))),
    db.select({ value: monetizationSettings.value }).from(monetizationSettings).where(eq(monetizationSettings.key, "referral_reward")).limit(1),
  ]);
  const configuredReward = typeof rewardSetting[0]?.value === "number" ? rewardSetting[0].value : Number(rewardSetting[0]?.value || 25);
  const reward = Number.isFinite(configuredReward) ? configuredReward : 25;

  return NextResponse.json({
    code: uRow?.referralCode || "",
    invitedCount: uRow?.invitedCount || 0,
    link: uRow?.referralCode ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/cadastro?ref=${uRow.referralCode}` : "",
    totalBonusEarned: reward * (stats[0]?.c || 0),
    referrals: myReferrals,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login primeiro." }, { status: 401 });

  const code = randomBytes(6).toString("hex").toUpperCase().slice(0, 8);
  await db.update(users).set({ referralCode: code }).where(eq(users.id, user.id));
  return NextResponse.json({ code });
}
