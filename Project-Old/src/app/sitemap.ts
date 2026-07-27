import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fretetruck.app";

  const staticPages = [
    "", "/fretes", "/publicar", "/calculadora", "/mapa", "/precos", "/ia",
    "/rankings", "/comunidade", "/seguro", "/cadastro", "/entrar",
    "/ajuda", "/sobre", "/termos", "/privacidade",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1 : path === "/fretes" ? 0.9 : 0.7,
  }));

  // Dynamic freight pages — wrapped in try/catch for build safety
  let freightPages: MetadataRoute.Sitemap = [];
  try {
    const { db } = await import("@/db");
    const { freights } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const rows = await db
      .select({ id: freights.id, createdAt: freights.createdAt })
      .from(freights)
      .where(eq(freights.status, "ativo"))
      .orderBy(desc(freights.createdAt))
      .limit(500);

    freightPages = rows.map((f) => ({
      url: `${baseUrl}/fretes/${f.id}`,
      lastModified: f.createdAt instanceof Date ? f.createdAt : new Date(String(f.createdAt)),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available during build — return only static pages
  }

  return [...staticPages, ...freightPages];
}
