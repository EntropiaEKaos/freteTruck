import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { pool } from "@/db";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token e senha obrigatórios." }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Senha mínima: 6 caracteres." }, { status: 400 });

  const result = await pool.query(
    "SELECT id, user_id FROM password_resets WHERE token=$1 AND used=false AND expires_at > NOW() LIMIT 1",
    [token]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Token inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const { id: resetId, user_id: userId } = result.rows[0];

  await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, userId));
  await pool.query("UPDATE password_resets SET used=true WHERE id=$1", [resetId]);

  return NextResponse.json({ ok: true, message: "Senha alterada com sucesso!" });
}
