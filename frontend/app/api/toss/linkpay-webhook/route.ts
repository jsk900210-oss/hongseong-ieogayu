import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { marketOrders } from "../../../../db/schema";
import { fetchLinkPayOrder, orderHasProduct, orderPaidAmount, orderPaymentStatus, type TossOrder } from "../linkpay";

type LinkPayEvent = {
  eventType?: string;
  data?: TossOrder;
};

export async function POST(request: Request) {
  const event = await request.json().catch(() => null) as LinkPayEvent | null;
  if (event?.eventType !== "ORDER_PAYMENT_STATUS_CHANGED" || !event.data?.orderKey) {
    return NextResponse.json({ ok: true });
  }

  const orderKey = event.data.orderKey;
  const verified = await fetchLinkPayOrder(orderKey);
  if (!verified) return NextResponse.json({ error: "결제 정보를 검증하지 못했습니다." }, { status: 503 });

  const productKey = verified.orderItems
    ?.map((item) => item.product?.productKey ?? item.productKey)
    .find((value): value is string => Boolean(value));
  if (!productKey) return NextResponse.json({ error: "상품 정보를 확인하지 못했습니다." }, { status: 400 });

  const db = getDb();
  const rows = await db.select().from(marketOrders).where(eq(marketOrders.tossProductKey, productKey)).limit(1);
  const local = rows[0];
  if (!local) return NextResponse.json({ ok: true });

  const expectedAmount = local.unitPrice * local.quantity;
  const paidAmount = orderPaidAmount(verified);
  if (!orderHasProduct(verified, productKey) || paidAmount !== expectedAmount) {
    return NextResponse.json({ error: "주문 금액 또는 상품이 일치하지 않습니다." }, { status: 400 });
  }

  const paymentStatus = orderPaymentStatus(verified);
  const completed = paymentStatus === "DONE";
  const canceled = paymentStatus === "CANCELED" || paymentStatus === "PARTIAL_CANCELED";
  await db.update(marketOrders).set({
    tossOrderKey: orderKey,
    tossPaymentStatus: paymentStatus,
    ...(completed ? { status: "completed", confirmedAt: new Date() } : {}),
    ...(canceled ? { status: "payment_canceled", confirmedAt: null } : {}),
  }).where(eq(marketOrders.id, local.id));

  return NextResponse.json({ ok: true });
}
