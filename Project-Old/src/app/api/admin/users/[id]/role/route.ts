import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const { id } = await params;
  const b = await req.json();

  if (b.verified !== undefined) {
    await db.update(users).set({ verified: !!b.verified }).where(eq(users.id, parseInt(id)));
  }
  if (b.credits !== undefined) {
    const amount = parseFloat(b.credits) - 0; // make it a number
    await db.execute(`UPDATE users SET credits = credits + ${amount} WHERE id = ${parseInt(id)}`);
  }
  if (b.role && ["motorista", "embarcador", "admin"].includes(b.role)) {
    await db.update(users).set({ role: b.role }).where(eq(users.id, parseInt(id)));
  }

  return NextResponse.json({ ok: true });
}
