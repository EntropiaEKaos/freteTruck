import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemAnnouncements } from "@/db/schema";
import { and, desc, eq, isNull, lte, or, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(systemAnnouncements)
      .where(and(
        eq(systemAnnouncements.active, true),
        lte(systemAnnouncements.startsAt, now),
        or(isNull(systemAnnouncements.endsAt), gte(systemAnnouncements.endsAt, now))
      ))
      .orderBy(desc(systemAnnouncements.createdAt))
      .limit(3);
    return NextResponse.json({ announcements: rows });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}
