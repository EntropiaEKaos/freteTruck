import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const rows = await db
    .select({ doc: documents, userName: users.name })
    .from(documents)
    .innerJoin(users, eq(documents.userId, users.id))
    .where(eq(documents.status, "pendente"))
    .orderBy(documents.createdAt);

  return NextResponse.json({ documents: rows });
}
