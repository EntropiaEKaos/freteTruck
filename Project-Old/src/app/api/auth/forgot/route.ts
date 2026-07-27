import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { pool } from "@/db";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });

  const rows = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  
  // Always return success to prevent email enumeration
  if (rows.length === 0) return NextResponse.json({ ok: true, message: "Se o e-mail existir, você receberá instruções." });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [rows[0].id, token, expiresAt]
  );

  // In production: send email with reset link
  // For now: log the token (visible in server logs)
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-senha?token=${token}`;
  console.log(`[RESET] User ${rows[0].name} (${email}) → Token: ${token}`);
  console.log(`[RESET] Link: ${resetUrl}`);

  return NextResponse.json({ 
    ok: true, 
    message: "Se o e-mail existir, você receberá instruções.",
    // DEV ONLY: return token for testing (remove in production)
    ...(process.env.NODE_ENV !== "production" ? { devToken: token, devLink: resetUrl } : {}),
  });
}
