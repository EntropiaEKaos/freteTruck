import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingOrders, monetizationSettings, subscriptionPlans, truckProducts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { creditTrucks } from "@/lib/trucks";
import { auditLog } from "@/lib/audit";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });

  const [settings, products, plans, orders] = await Promise.all([
    db.select().from(monetizationSettings).orderBy(monetizationSettings.key),
    db.select().from(truckProducts).orderBy(truckProducts.sortOrder),
    db.select().from(subscriptionPlans).orderBy(subscriptionPlans.priceCents),
    db.select({ order: billingOrders, userName: users.name, userEmail: users.email, productName: truckProducts.name })
      .from(billingOrders).innerJoin(users, eq(billingOrders.userId, users.id)).innerJoin(truckProducts, eq(billingOrders.productId, truckProducts.id))
      .orderBy(desc(billingOrders.createdAt)).limit(100),
  ]);

  return NextResponse.json({ settings, products, plans, orders });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const b = await req.json();

  if (b.kind === "setting") {
    if (!b.key) return NextResponse.json({ error: "Key obrigatória." }, { status: 400 });
    const existing = await db.select().from(monetizationSettings).where(eq(monetizationSettings.key, b.key)).limit(1);
    if (existing.length > 0) {
      await db.update(monetizationSettings).set({ value: JSON.stringify(b.value), updatedBy: admin.id, updatedAt: new Date() }).where(eq(monetizationSettings.key, b.key));
    } else {
      await db.insert(monetizationSettings).values({
        key: b.key,
        value: JSON.stringify(b.value),
        label: b.label || b.key,
        description: b.description || null,
        updatedBy: admin.id,
      });
    }
    await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.monetization_setting_update", entity: "monetization_setting", details: { key: b.key, value: b.value } });
    return NextResponse.json({ ok: true });
  }

  if (b.kind === "product") {
    const id = parseInt(b.id, 10);
    const updates: Partial<typeof truckProducts.$inferInsert> = {};
    if (b.name !== undefined) updates.name = String(b.name).trim();
    if (b.description !== undefined) updates.description = b.description || null;
    if (b.trucks !== undefined) updates.trucks = Math.max(1, parseInt(b.trucks, 10));
    if (b.priceCents !== undefined) updates.priceCents = Math.max(0, parseInt(b.priceCents, 10));
    if (b.active !== undefined) updates.active = !!b.active;
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
    await db.update(truckProducts).set(updates).where(eq(truckProducts.id, id));
    await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.monetization_product_update", entity: "truck_product", entityId: id, details: updates as Record<string, unknown> });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  const b = await req.json();

  if (b.kind === "grant") {
    const userId = parseInt(b.userId, 10);
    const trucks = parseInt(b.trucks, 10);
    if (Number.isNaN(userId) || Number.isNaN(trucks) || trucks <= 0) return NextResponse.json({ error: "Usuário e Trucks inválidos." }, { status: 400 });
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const wallet = await creditTrucks({ userId, amount: trucks, type: "admin_grant", description: b.description || `Bônus administrativo concedido por ${admin.name}`, referenceType: "admin", referenceId: admin.id });
    await auditLog({ userId: admin.id, actorEmail: admin.email, action: "admin.trucks_grant", entity: "user", entityId: userId, details: { trucks } });
    return NextResponse.json({ wallet });
  }

  if (b.kind === "product") {
    const [created] = await db.insert(truckProducts).values({
      code: String(b.code).trim(), name: String(b.name).trim(), description: b.description || null,
      trucks: parseInt(b.trucks, 10), priceCents: parseInt(b.priceCents, 10), active: true,
    }).returning();
    return NextResponse.json({ product: created }, { status: 201 });
  }

  return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
}
