import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaUploads, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { onlyDigits } from "@/lib/constants";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const b = await req.json();
  const updates: Record<string, unknown> = {};

  if (b.name?.trim()) updates.name = b.name.trim();
  if (b.phone?.trim()) updates.phone = onlyDigits(b.phone);
  if (b.city !== undefined) updates.city = b.city?.trim() || null;
  if (b.state !== undefined) updates.state = b.state || null;
  if (b.company !== undefined) updates.company = b.company?.trim() || null;
  if (b.bio !== undefined) updates.bio = b.bio?.trim() || null;
  if (b.vehicleType !== undefined) updates.vehicleType = b.vehicleType || null;
  if (b.bodyType !== undefined) updates.bodyType = b.bodyType || null;
  if (b.plateNumber !== undefined) updates.plateNumber = b.plateNumber?.trim() || null;

  if (b.avatarData && typeof b.avatarData === "string" && b.avatarData.startsWith("data:image/")) {
    try {
      const m = b.avatarData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (m) {
        const mimeType = `image/${m[1]}`;
        const ext = m[1] === "png" ? "png" : m[1] === "webp" ? "webp" : "jpg";
        const buf = Buffer.from(m[2], "base64");
        if (buf.length <= 4 * 1024 * 1024) {
          const { ensureMediaUploadsTable } = await import("@/lib/media");
          await ensureMediaUploadsTable();
          const filename = `avatar_${user.id}_${Date.now()}.${ext}`;
          await db.insert(mediaUploads).values({
            filename,
            mimeType,
            dataBase64: b.avatarData,
          });
          updates.avatarUrl = `/api/uploads/${filename}`;
        }
      }
    } catch (e) {
      console.error("avatar upload error:", e);
    }
  }

  // Password change
  if (b.newPassword) {
    if (!b.currentPassword) return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
    if (!verifyPassword(b.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
    }
    if (b.newPassword.length < 6) return NextResponse.json({ error: "Nova senha: mínimo 6 caracteres." }, { status: 400 });
    updates.passwordHash = hashPassword(b.newPassword);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, user.id)).returning();

  return NextResponse.json({
    user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, city: updated.city, state: updated.state, company: updated.company, bio: updated.bio, vehicleType: updated.vehicleType, bodyType: updated.bodyType, plateNumber: updated.plateNumber, avatarUrl: updated.avatarUrl },
  });
}
