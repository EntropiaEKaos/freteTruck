import { NextResponse } from "next/server";
import { db } from "@/db";
import { billingOrders, truckProducts, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { creditTrucks } from "@/lib/trucks";
import { auditLog } from "@/lib/audit";
import { getMPPayment, isMPEnabled } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[MP Webhook]", JSON.stringify(body).slice(0, 300));

    if (!isMPEnabled()) return NextResponse.json({ ok: false, reason: "mp_disabled" }, { status: 200 });

    // Mercado Pago envia notificações de dois tipos: payment e merchant_order
    const topic = body.type || body.topic || "";
    const id = body.data?.id || body.id;

    if (topic === "payment" && id) {
      const payment = await getMPPayment(String(id));
      if (!payment || !payment.externalReference) {
        return NextResponse.json({ ok: false, reason: "no_external_ref" }, { status: 200 });
      }

      const orderId = parseInt(payment.externalReference, 10);
      if (Number.isNaN(orderId)) return NextResponse.json({ ok: false, reason: "bad_ref" }, { status: 200 });

      const [row] = await db
        .select({ order: billingOrders, product: truckProducts })
        .from(billingOrders)
        .innerJoin(truckProducts, eq(billingOrders.productId, truckProducts.id))
        .where(eq(billingOrders.id, orderId))
        .limit(1);

      if (!row) return NextResponse.json({ ok: false, reason: "order_not_found" }, { status: 200 });

      if (payment.status === "approved" && row.order.status !== "paid") {
        const [updated] = await db
          .update(billingOrders)
          .set({ status: "paid", providerReference: String(payment.id), paidAt: new Date() })
          .where(and(eq(billingOrders.id, orderId), eq(billingOrders.status, "pending")))
          .returning();

        if (updated) {
          await creditTrucks({
            userId: row.order.userId,
            amount: row.order.trucks,
            type: "purchase",
            description: `Compra via Mercado Pago: ${row.product.name}`,
            referenceType: "billing_order",
            referenceId: orderId,
          });
          await auditLog({
            userId: row.order.userId,
            action: "billing.order_paid_mp",
            entity: "billing_order",
            entityId: orderId,
            details: { provider: "mercadopago", paymentId: payment.id, trucks: row.order.trucks },
          });
        }
      } else if (payment.status === "rejected" && row.order.status === "pending") {
        await db.update(billingOrders).set({ status: "failed", providerReference: String(payment.id) }).where(eq(billingOrders.id, orderId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[MP Webhook] error:", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
