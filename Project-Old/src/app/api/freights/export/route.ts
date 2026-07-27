import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const rows = await db
    .select()
    .from(freights)
    .where(eq(freights.userId, user.id))
    .orderBy(desc(freights.createdAt));

  const headers = [
    "ID", "Status", "Cidade Origem", "UF Origem", "Cidade Destino", "UF Destino",
    "Tipo de Carga", "Peso (kg)", "Distancia (km)", "Preco", "Tipo Preco",
    "Veiculos", "Carrocerias", "Rastreador", "Lona", "Pedagio",
    "Data Carregamento", "Contato", "Telefone", "Visualizacoes",
    "Leilao", "Destacado", "Criado em",
  ];

  const csvRows = rows.map((f) => [
    f.id, f.status, f.originCity, f.originState, f.destCity, f.destState,
    f.cargoType, f.weightKg, f.distanceKm || "", f.price || "A combinar", f.priceType,
    `"${f.vehicleTypes}"`, `"${f.bodyTypes}"`, f.needsTracker ? "Sim" : "Nao", f.needsTarp ? "Sim" : "Nao", f.toll ? "Sim" : "Nao",
    f.loadDate || "", f.contactName, f.contactPhone, f.views,
    f.isAuction ? "Sim" : "Nao", f.featured ? "Sim" : "Nao",
    f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
  ].join(","));

  const csv = [headers.join(","), ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fretetruck_meus_fretes_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
