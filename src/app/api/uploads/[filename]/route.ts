import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, mediaUploads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ filename: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_.-]{1,160}$/.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Private verification documents require both login and ownership (or admin).
  // Legacy demo files are always unavailable.
  if (filename.startsWith("demo_")) {
    return new NextResponse("Not found", { status: 404 });
  }
  const isDocument = filename.startsWith("doc_");
  if (isDocument) {
    const user = await getCurrentUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const [doc] = await db.select({ userId: documents.userId })
      .from(documents)
      .where(eq(documents.fileUrl, `/api/uploads/${filename}`))
      .limit(1);
    if (!doc) return new NextResponse("Not found", { status: 404 });
    if (doc.userId !== user.id && user.role !== "admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    const [media] = await db.select().from(mediaUploads)
      .where(eq(mediaUploads.filename, filename)).limit(1);
    if (!media) return new NextResponse("Not found", { status: 404 });

    const base64Data = media.dataBase64.includes("base64,")
      ? media.dataBase64.split("base64,")[1] : media.dataBase64;
    const buffer = Buffer.from(base64Data, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Cache-Control": isDocument ? "private, no-store" : "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao consultar upload:", error);
    return new NextResponse("Erro ao carregar arquivo", { status: 500 });
  }
}
