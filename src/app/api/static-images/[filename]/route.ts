import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { filename } = await params;

  try {
    const filePath = join(process.cwd(), "public", "images", filename);
    if (existsSync(filePath)) {
      const buf = readFileSync(filePath);
      const ext = filename.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : ext === "svg"
          ? "image/svg+xml"
          : "image/jpeg";
      return new NextResponse(buf, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (e) {
    console.error("Error reading static image:", e);
  }

  // Fallback de CDN garantido — retorna SVG otimizado do FreteTruck
  const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="600" viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#bg)"/>
  <circle cx="600" cy="240" r="80" fill="#f97316" fill-opacity="0.2"/>
  <path d="M570 200 h40 v30 h-40 z M610 215 h15 l10 15 v15 h-25 z" fill="none" stroke="#f97316" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="585" cy="255" r="8" fill="#f97316"/>
  <circle cx="625" cy="255" r="8" fill="#f97316"/>
  <text x="600" y="360" font-family="system-ui, sans-serif" font-size="36" font-weight="800" fill="#ffffff" text-anchor="middle">Frete<tspan fill="#f97316">Truck</tspan></text>
  <text x="600" y="400" font-family="system-ui, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">O maior parceiro do caminhoneiro brasileiro</text>
</svg>`;

  return new NextResponse(fallbackSvg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
