import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { headers } from "next/headers";

export type AuditAction =
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "auth.password_reset"
  | "auth.account_deleted"
  | "freight.create"
  | "freight.update"
  | "freight.close"
  | "freight.delete"
  | "proposal.create"
  | "proposal.accept"
  | "proposal.reject"
  | "document.upload"
  | "admin.document_approve"
  | "admin.document_reject"
  | "admin.credits_grant"
  | "admin.user_verify"
  | "admin.user_role_change"
  | "data.export"
  | "fiscal.create"
  | "fiscal.emit"
  | "fiscal.cancel"
  | "terms.accepted";

export async function auditLog(params: {
  userId?: number | null;
  actorEmail?: string | null;
  action: AuditAction | string;
  entity?: string;
  entityId?: number;
  details?: Record<string, unknown>;
}) {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    } catch {}

    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      entity: params.entity ?? null,
      entityId: params.entityId ?? null,
      details: params.details ? JSON.stringify(params.details) : null,
      ip,
    });
  } catch (e) {
    // Audit log must never break the main flow
    console.error("auditLog error:", e);
  }
}
