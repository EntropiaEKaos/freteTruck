import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingOrders, truckProducts, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isMPEnabled, createMPPreference } from "@/lib/mercadopago";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para pagar." }, { status: 401 });

  const { id } = await params;
  const orderId = parseInt(id, 10);
  const body = await req.json().catch(() => ({}));

  const [row] = await db
    .select({ order: billingOrders, product: truckProducts })
    .from(billingOrders)
    .innerJoin(truckProducts, eq(billingOrders.productId, truckProducts.id))
    .where(eq(billingOrders.id, orderId))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (row.order.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (row.order.status !== "pending") return NextResponse.json({ error: "Pedido já processado." }, { status: 409 });

  // Se Mercado Pago habilitado, criar preferência real
  if (isMPEnabled()) {
    try {
      const [payer] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const pref = await createMPPreference({
        orderId: row.order.id,
        productName: row.product.name,
        productDescription: `${row.order.trucks} Trucks FreteTruck`,
        amountCents: row.order.amountCents,
        trucks: row.order.trucks,
        payerEmail: payer?.email || `${user.id}@fretetruck.user`,
        payerName: payer?.name,
        paymentMethods: {
          excludedPaymentTypes: body.excludeBoleto ? ["ticket"] : undefined,
          installments: body.installments || 12,
        },
      });

      await db.update(billingOrders).set({ provider: "mercadopago", providerReference: pref.id }).where(eq(billingOrders.id, orderId));

      return NextResponse.json({
        provider: "mercadopago",
        checkoutUrl: pref.initPoint,
        sandboxUrl: pref.sandboxInitPoint,
        preferenceId: pref.id,
        message: "Redirecionando para o Mercado Pago...",
      });
    } catch (e) {
      console.error("MP checkout error:", e);
      return NextResponse.json({ error: "Erro ao criar pagamento no Mercado Pago. Tente novamente." }, { status: 502 });
    }
  }

  // Fallback beta/manual
  return NextResponse.json({
    provider: "manual_beta",
    message: "Mercado Pago não configurado. Use o botão de confirmação manual.",
    payUrl: `/api/trucks/orders/${orderId}/pay`,
  });
}
