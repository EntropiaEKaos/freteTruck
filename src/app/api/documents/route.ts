import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const rows = await db.select().from(documents).where(eq(documents.userId, user.id)).orderBy(desc(documents.createdAt));
  const [uRow] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

  return NextResponse.json({ documents: rows, verified: uRow?.verified || false });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para enviar documentos." }, { status: 401 });

  const b = await req.json();
  if (!b.docType || !["cnh", "rntc", "crvl", "cltm"].includes(b.docType)) {
    return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
  }

  let fileUrl = "";

  if (b.fileData && typeof b.fileData === "string" && b.fileData.startsWith("data:")) {
    // Real base64 upload — save to public/uploads/
    try {
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

      const matches = b.fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return NextResponse.json({ error: "Formato de arquivo inválido." }, { status: 400 });

      const ext = matches[1].includes("pdf") ? "pdf" : matches[1].includes("png") ? "png" : "jpg";
      const filename = `doc_${user.id}_${b.docType}_${Date.now()}.${ext}`;
      const buffer = Buffer.from(matches[2], "base64");

      // Limit 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Arquivo muito grande (max 5MB)." }, { status: 400 });
      }

      writeFileSync(join(uploadsDir, filename), buffer);
      fileUrl = `/uploads/${filename}`;
    } catch (err) {
      console.error("Upload error:", err);
      return NextResponse.json({ error: "Erro ao salvar arquivo." }, { status: 500 });
    }
  } else {
    // Simulated upload for demo/testing
    fileUrl = `/uploads/demo_${b.docType}_${user.id}.jpg`;
  }

  const [doc] = await db.insert(documents).values({
    userId: user.id,
    docType: b.docType,
    fileUrl,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
  }).returning();

  return NextResponse.json({ doc }, { status: 201 });
}
