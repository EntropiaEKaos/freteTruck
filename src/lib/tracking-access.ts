import { db } from "@/db";
import { freights, proposals } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Only the freight owner, an administrator and the accepted driver may see a trip. */
export async function getTrackingAccess(freightId: number, userId: number, role: string) {
  const [freight] = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  if (!freight) return { freight: null, canRead: false, canWrite: false };

  const [accepted] = await db.select({ id: proposals.id }).from(proposals).where(and(
    eq(proposals.freightId, freightId),
    eq(proposals.driverId, userId),
    eq(proposals.status, "aceita"),
  )).limit(1);
  const isAssignedDriver = Boolean(accepted);
  return {
    freight,
    canRead: role === "admin" || freight.userId === userId || isAssignedDriver,
    canWrite: isAssignedDriver && !freight.delivered,
  };
}
