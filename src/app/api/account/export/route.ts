import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users, freights, proposals, messages, notifications, reviews,
  favorites, alerts, documents, transactions, referrals, fiscalDocuments,
} from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

// LGPD — Art. 18, V: portabilidade dos dados
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const [
    myFreights, sentProposals, myMessages, myNotifications, myReviews,
    reviewsAboutMe, myFavorites, myAlerts, myDocuments, myTransactions, myReferrals, myFiscal,
  ] = await Promise.all([
    db.select().from(freights).where(eq(freights.userId, user.id)),
    db.select().from(proposals).where(eq(proposals.driverId, user.id)),
    db.select().from(messages).where(or(eq(messages.senderId, user.id), eq(messages.receiverId, user.id))),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
    db.select().from(reviews).where(eq(reviews.authorId, user.id)),
    db.select().from(reviews).where(eq(reviews.ratedUserId, user.id)),
    db.select().from(favorites).where(eq(favorites.userId, user.id)),
    db.select().from(alerts).where(eq(alerts.userId, user.id)),
    db.select().from(documents).where(eq(documents.userId, user.id)),
    db.select().from(transactions).where(eq(transactions.userId, user.id)),
    db.select().from(referrals).where(or(eq(referrals.inviterId, user.id), eq(referrals.invitedId, user.id))),
    db.select().from(fiscalDocuments).where(eq(fiscalDocuments.userId, user.id)),
  ]);

  await auditLog({ userId: user.id, actorEmail: user.email, action: "data.export", entity: "user", entityId: user.id });

  const { passwordHash, ...safeUser } = user;

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    format: "FreteTruck LGPD Data Export v1",
    user: safeUser,
    data: {
      freights: myFreights,
      proposals: sentProposals,
      messages: myMessages,
      notifications: myNotifications,
      reviewsWritten: myReviews,
      reviewsReceived: reviewsAboutMe,
      favorites: myFavorites,
      alerts: myAlerts,
      documents: myDocuments.map((d) => ({ ...d, fileUrl: "/api/documents/" + d.id })),
      transactions: myTransactions,
      referrals: myReferrals,
      fiscalDocuments: myFiscal,
    },
    note: "Este arquivo contém todos os dados pessoais armazenados na sua conta, conforme a lei 13.709/2018 (LGPD).",
  });
}
