import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, freights, proposals, notifications, favorites, alerts, sessions, messages, reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, verifyPassword, clearSessionCookie } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

// LGPD — Art. 18, VI: eliminação dos dados pessoais (direito ao esquecimento)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { password, confirmation } = await req.json();
  if (confirmation !== "EXCLUIR MINHA CONTA") {
    return NextResponse.json({ error: "Digite exatamente 'EXCLUIR MINHA CONTA' para confirmar." }, { status: 400 });
  }
  if (!verifyPassword(password || "", user.passwordHash)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 403 });
  }

  // Fecha fretes ativos (mantém histórico fechado)
  await db.update(freights).set({ status: "cancelado" }).where(and(eq(freights.userId, user.id), eq(freights.status, "ativo")));
  // Rejeita propostas pendentes pendentes do usuário
  await db.update(proposals).set({ status: "recusada" }).where(and(eq(proposals.driverId, user.id), eq(proposals.status, "pendente")));

  // Anonimiza dados pessoais (mantém integridade referencial do sistemas)
  const anonymizedEmail = `deleted_${user.id}_${Date.now()}@fretetruck.local`;
  const anonymizedName = "Conta excluída";

  await db.update(users).set({
    name: anonymizedName,
    email: anonymizedEmail,
    phone: "",
    company: null,
    city: null,
    state: null,
    bio: null,
    avatarUrl: null,
    plateNumber: null,
    vehicleType: null,
    bodyType: null,
    credits: "0",
    referralCode: null,
    deletedAt: new Date(),
  }).where(eq(users.id, user.id));

  // Mata sessões e limpa dados pessoais transientes
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await db.delete(favorites).where(eq(favorites.userId, user.id));
  await db.delete(alerts).where(eq(alerts.userId, user.id));
  await db.delete(notifications).where(eq(notifications.userId, user.id));

  await auditLog({
    userId: user.id,
    actorEmail: user.email,
    action: "auth.account_deleted",
    entity: "user",
    entityId: user.id,
    details: { anonymizedTo: anonymizedEmail, reason: "user_request_lgpd" },
  });

  await clearSessionCookie();
  return NextResponse.json({ ok: true, message: "Conta excluída e dados anonimizados conforme a LGPD." });
}
