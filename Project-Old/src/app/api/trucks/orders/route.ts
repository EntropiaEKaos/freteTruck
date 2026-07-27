import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingOrders, truckProducts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const orders = await db.select({ order: billingOrders, product: truckProducts })
    .from(billingOrders).innerJoin(truckProducts, eq(billingOrders.productId, truckProducts.id))
    .where(eq(billingOrders.userId, user.id)).orderBy(desc(billingOrders.createdAt)).limit(50);
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para comprar Trucks." }, { status: 401 });
  const { productId } = await req.json();
  const id = parseInt(productId, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Produto inválido." }, { status: 400 });

  const [product] = await db.select().from(truckProducts).where(eq(truckProducts.id, id)).limit(1);
  if (!product || !product.active) return NextResponse.json({ error: "Produto indisponível." }, { status: 404 });

  const [order] = await db.insert(billingOrders).values({
    userId: user.id,
    productId: product.id,
    amountCents: product.priceCents,
    trucks: product.trucks,
    provider: "manual_beta",
  }).returning();

  await auditLog({ userId: user.id, actorEmail: user.email, action: "billing.order_create", entity: "billing_order", entityId: order.id, details: { product: product.code, trucks: product.trucks, amountCents: product.priceCents } });
  return NextResponse.json({ order, beta: true, message: "Pedido criado. No beta, confirme o pagamento manualmente." }, { status: 201 });
}
