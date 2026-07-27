import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingOrders, truckProducts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { creditTrucks } from "@/lib/trucks";
import { auditLog } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;
  const orderId = parseInt(id, 10);
  const [row] = await db.select({ order: billingOrders, product: truckProducts }).from(billingOrders).innerJoin(truckProducts, eq(billingOrders.productId, truckProducts.id)).where(eq(billingOrders.id, orderId)).limit(1);
  if (!row) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (row.order.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (row.order.status === "paid") return NextResponse.json({ error: "Pedido já pago." }, { status: 409 });

  // Beta/manual checkout. Replace this action with a provider webhook in production.
  const [updated] = await db.update(billingOrders).set({ status: "paid", providerReference: `beta_${Date.now()}`, paidAt: new Date() }).where(and(eq(billingOrders.id, orderId), eq(billingOrders.status, "pending"))).returning();
  if (!updated) return NextResponse.json({ error: "Pedido já processado por outra operação." }, { status: 409 });
  await creditTrucks({ userId: row.order.userId, amount: row.order.trucks, type: "purchase", description: `Compra do ${row.product.name}`, referenceType: "billing_order", referenceId: orderId });
  await auditLog({ userId: user.id, actorEmail: user.email, action: "billing.order_paid_beta", entity: "billing_order", entityId: orderId, details: { trucks: row.order.trucks } });
  return NextResponse.json({ order: updated, message: `${row.order.trucks} Trucks creditados.` });
}
