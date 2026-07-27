import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, mediaUploads, users } from "@/db/schema";
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
    try {
      const matches = b.fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return NextResponse.json({ error: "Formato de arquivo inválido." }, { status: 400 });

      const mimeType = matches[1];
      const ext = mimeType.includes("pdf") ? "pdf" : mimeType.includes("png") ? "png" : "jpg";
      const filename = `doc_${user.id}_${b.docType}_${Date.now()}.${ext}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Limit 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Arquivo muito grande (max 5MB)." }, { status: 400 });
      }

      // 1. Salvar no banco PostgreSQL (funciona em Vercel/serverless e em qualquer lugar)
      await db.insert(mediaUploads).values({
        filename,
        mimeType,
        dataBase64: b.fileData,
      });
      fileUrl = `/api/uploads/${filename}`;

      // 2. Opcional/Fallback: tentar salvar no disco (para dev local se public/uploads for gravável)
      try {
        const uploadsDir = join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
        writeFileSync(join(uploadsDir, filename), buffer);
      } catch {}
    } catch (err) {
      console.error("Upload error:", err);
      return NextResponse.json({ error: "Erro ao salvar arquivo no banco." }, { status: 500 });
    }
  } else {
    fileUrl = `/api/uploads/demo_${b.docType}_${user.id}.jpg`;
  }

  const [doc] = await db.insert(documents).values({
    userId: user.id,
    docType: b.docType,
    fileUrl,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
  }).returning();

  return NextResponse.json({ doc }, { status: 201 });
}
