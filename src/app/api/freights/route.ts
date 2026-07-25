import { NextResponse } from "next/server";
import { db } from "@/db";
import { freights, users, monetizationSettings } from "@/db/schema";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { onlyDigits } from "@/lib/constants";
import { debitTrucks } from "@/lib/trucks";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conditions: SQL[] = [eq(freights.status, "ativo")];

  const originState = searchParams.get("originState");
  const originCity = searchParams.get("originCity");
  const destState = searchParams.get("destState");
  const destCity = searchParams.get("destCity");
  const vehicle = searchParams.get("vehicle");
  const body = searchParams.get("body");
  const q = searchParams.get("q");
  const mine = searchParams.get("mine");

  if (mine === "1") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    conditions.length = 0;
    conditions.push(eq(freights.userId, user.id));
  }

  if (originState) conditions.push(eq(freights.originState, originState));
  if (originCity) conditions.push(ilike(freights.originCity, `%${originCity}%`));
  if (destState) conditions.push(eq(freights.destState, destState));
  if (destCity) conditions.push(ilike(freights.destCity, `%${destCity}%`));
  if (vehicle) conditions.push(ilike(freights.vehicleTypes, `%${vehicle}%`));
  if (body) conditions.push(ilike(freights.bodyTypes, `%${body}%`));
  if (q) {
    const cond = or(
      ilike(freights.cargoType, `%${q}%`),
      ilike(freights.originCity, `%${q}%`),
      ilike(freights.destCity, `%${q}%`)
    );
    if (cond) conditions.push(cond);
  }

  // Featured first, then by date
  const rows = await db
    .select({ freight: freights, ownerName: users.name, ownerCompany: users.company, ownerVerified: users.verified })
    .from(freights)
    .innerJoin(users, eq(freights.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(freights.featured), desc(freights.createdAt))
    .limit(100);

  return NextResponse.json({ freights: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para publicar um frete." }, { status: 401 });

  try {
    const b = await req.json();
    const required = ["cargoType", "originCity", "originState", "destCity", "destState", "weightKg", "vehicleTypes", "bodyTypes", "contactPhone"];
    for (const f of required) {
      if (!b[f] || (Array.isArray(b[f]) && b[f].length === 0)) {
        return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
      }
    }

    const wantsFeatured = !!b.featured;
    const [featuredSetting] = await db.select({ value: monetizationSettings.value }).from(monetizationSettings).where(eq(monetizationSettings.key, "featured_freight_cost")).limit(1);
    const configuredCost = typeof featuredSetting?.value === "number" ? featuredSetting.value : Number(featuredSetting?.value || 15);
    const FEATURED_COST = Number.isFinite(configuredCost) && configuredCost >= 0 ? Math.floor(configuredCost) : 15;

    // Check Trucks if featured
    if (wantsFeatured) {
      const { getTruckWallet } = await import("@/lib/trucks");
      const wallet = await getTruckWallet(user.id);
      if (wallet.balance < FEATURED_COST) {
        return NextResponse.json({ error: `Saldo insuficiente de Trucks. Você tem ${wallet.balance} Trucks, precisa de ${FEATURED_COST}.` }, { status: 402 });
      }
    }

    const isAuction = !!b.isAuction;

    const [created] = await db
      .insert(freights)
      .values({
        userId: user.id,
        cargoType: String(b.cargoType).trim(),
        description: b.description?.trim() || null,
        originCity: String(b.originCity).trim(),
        originState: b.originState,
        destCity: String(b.destCity).trim(),
        destState: b.destState,
        distanceKm: b.distanceKm ? parseInt(b.distanceKm, 10) : null,
        weightKg: parseInt(b.weightKg, 10),
        price: isAuction || b.priceType === "combinar" || !b.price ? null : String(b.price),
        priceType: isAuction ? "combinar" : (b.priceType || "total"),
        vehicleTypes: Array.isArray(b.vehicleTypes) ? b.vehicleTypes.join(",") : String(b.vehicleTypes),
        bodyTypes: Array.isArray(b.bodyTypes) ? b.bodyTypes.join(",") : String(b.bodyTypes),
        needsTracker: !!b.needsTracker,
        needsTarp: !!b.needsTarp,
        toll: !!b.toll,
        loadDate: b.loadDate || null,
        contactName: b.contactName?.trim() || user.name,
        contactPhone: onlyDigits(b.contactPhone),
        isRecurring: !!b.isRecurring,
        recurringFrequency: b.isRecurring ? (b.recurringFrequency || "semanal") : null,
        isAuction,
        minPrice: isAuction && b.minPrice ? String(b.minPrice) : null,
        featured: wantsFeatured,
      })
      .returning();

    const { auditLog } = await import("@/lib/audit");
    await auditLog({
      userId: user.id, actorEmail: user.email, action: "freight.create",
      entity: "freight", entityId: created.id,
      details: { route: `${created.originCity}/${created.originState} → ${created.destCity}/${created.destState}`, featured: wantsFeatured, auction: isAuction, recurring: !!b.isRecurring },
    });

    // Debit Trucks for featured
    if (wantsFeatured && FEATURED_COST > 0) {
      await debitTrucks({
        userId: user.id,
        amount: FEATURED_COST,
        type: "featured",
        description: `Destaque do frete #${created.id} (${created.originCity}/${created.originState} → ${created.destCity}/${created.destState})`,
        referenceType: "freight",
        referenceId: created.id,
      });
    }

    return NextResponse.json({ freight: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao publicar frete." }, { status: 500 });
  }
}
