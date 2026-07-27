import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
    }
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase().trim()), isNull(users.deletedAt)))
      .limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await auditLog({ action: "auth.login", entity: "user", details: { success: false, email } });
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    await setSessionCookie(user.id);
    await auditLog({ userId: user.id, actorEmail: user.email, action: "auth.login", entity: "user", entityId: user.id, details: { success: true } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao entrar." }, { status: 500 });
  }
}
