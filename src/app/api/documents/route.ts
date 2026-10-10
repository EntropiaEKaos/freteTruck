import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, mediaUploads, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

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
      if (!["application/pdf", "image/jpeg", "image/png"].includes(mimeType)) {
        return NextResponse.json({ error: "Envie PDF, JPEG ou PNG." }, { status: 400 });
      }
      const ext = mimeType.includes("pdf") ? "pdf" : mimeType.includes("png") ? "png" : "jpg";
      const filename = `doc_${user.id}_${b.docType}_${Date.now()}.${ext}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Limit 5MB
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Arquivo muito grande (max 5MB)." }, { status: 400 });
      }

      // 1. Salvar no banco PostgreSQL (funciona em Vercel/serverless e em qualquer lugar)
      const { ensureMediaUploadsTable } = await import("@/lib/media");
      await ensureMediaUploadsTable();
      await db.insert(mediaUploads).values({
        filename,
        mimeType,
        dataBase64: b.fileData,
      });
      fileUrl = `/api/uploads/${filename}`;

      // Confidential identity documents must never be copied into public/uploads.
    } catch (err) {
      console.error("Upload error:", err);
      return NextResponse.json({ error: "Erro ao salvar arquivo no banco." }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Arquivo obrigatório para verificação." }, { status: 400 });
  }

  const [doc] = await db.insert(documents).values({
    userId: user.id,
    docType: b.docType,
    fileUrl,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
  }).returning();

  return NextResponse.json({ doc }, { status: 201 });
}
