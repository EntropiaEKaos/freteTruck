import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, referrals, notifications, monetizationSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { creditTrucks } from "@/lib/trucks";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { onlyDigits } from "@/lib/constants";
import { randomBytes } from "crypto";
import { auditLog } from "@/lib/audit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, role, company, city, state, vehicleType, bodyType, refCode, acceptTerms } = body;

    if (acceptTerms !== true) {
      return NextResponse.json({ error: "É obrigatório aceitar os Termos de Uso e a Política de Privacidade." }, { status: 400 });
    }
    if (!name || !email || !password || !phone || !role) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }
    if (!["motorista", "embarcador"].includes(role)) {
      return NextResponse.json({ error: "Tipo de conta inválido." }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    // Look up inviter by referral code
    let inviterId: number | null = null;
    if (refCode) {
      const inviterRows = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, refCode.toUpperCase().trim())).limit(1);
      if (inviterRows.length > 0) inviterId = inviterRows[0].id;
    }

    const newRefCode = randomBytes(4).toString("hex").toUpperCase();

    const [user] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        phone: onlyDigits(phone),
        role,
        company: company?.trim() || null,
        city: city?.trim() || null,
        state: state || null,
        vehicleType: vehicleType || null,
        bodyType: bodyType || null,
        referralCode: newRefCode,
        referredBy: inviterId,
        termsAcceptedAt: new Date(),
      })
      .returning();

    await auditLog({ userId: user.id, actorEmail: user.email, action: "terms.accepted", entity: "user", entityId: user.id });
    await auditLog({ userId: user.id, actorEmail: user.email, action: "auth.register", entity: "user", entityId: user.id, details: { role, viaReferral: !!inviterId } });
    sendWelcomeEmail(user.email, user.name, user.role).catch(() => {});

    // Process referral bonus
    if (inviterId) {
      const [rewardSetting] = await db.select({ value: monetizationSettings.value }).from(monetizationSettings).where(eq(monetizationSettings.key, "referral_reward")).limit(1);
      const configuredReward = typeof rewardSetting?.value === "number" ? rewardSetting.value : Number(rewardSetting?.value || 25);
      const BONUS = Number.isFinite(configuredReward) && configuredReward > 0 ? Math.floor(configuredReward) : 25;
      // Create referral record
      await db.insert(referrals).values({
        inviterId,
        invitedId: user.id,
        status: "confirmed",
        bonusAmount: String(BONUS),
        creditedAt: new Date(),
      });
      // Increment legacy referral counter and credit the new Truck wallet
      await db.update(users).set({
        invitedCount: sql`COALESCE(invited_count, 0) + 1`,
      }).where(eq(users.id, inviterId));
      await creditTrucks({ userId: inviterId, amount: BONUS, type: "referral", description: `Bônus por convidar ${name.trim()}`, referenceType: "user", referenceId: user.id });
      await creditTrucks({ userId: user.id, amount: BONUS, type: "referral", description: "Bônus de boas-vindas por convite", referenceType: "user", referenceId: inviterId });
      // Notify inviter
      await db.insert(notifications).values({
        userId: inviterId,
        type: "referral",
        title: "🎁 Novo convite confirmado!",
        body: `${name.trim()} se cadastrou pelo seu link. Você ganhou R$ 25 em créditos!`,
        link: "/convite",
      });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}
