import { NextResponse } from "next/server";
import { db } from "@/db";
import { mediaUploads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { filename } = await params;
  if (!filename) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const rows = await db
      .select()
      .from(mediaUploads)
      .where(eq(mediaUploads.filename, filename))
      .limit(1);

    const media = rows[0];
    if (!media) {
      // Tentar verificar se arquivo existe no disco (fallback dev/local)
      try {
        const { readFileSync, existsSync } = await import("fs");
        const { join } = await import("path");
        const filePath = join(process.cwd(), "public", "uploads", filename);
        if (existsSync(filePath)) {
          const buf = readFileSync(filePath);
          const ext = filename.split(".").pop()?.toLowerCase();
          const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
          return new NextResponse(buf, {
            headers: {
              "Content-Type": mime,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch {}
      return new NextResponse("Not found in media uploads", { status: 404 });
    }

    // Convert base64 data to Buffer
    let base64Data = media.dataBase64;
    // Strip data URL prefix if present (e.g., data:image/jpeg;base64,)
    if (base64Data.includes("base64,")) {
      base64Data = base64Data.split("base64,")[1];
    }

    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("Error serving media upload:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
