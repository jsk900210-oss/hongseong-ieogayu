import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { marketOrders, users } from "../../../db/schema";
import { getGoogleUser } from "../../google-auth";

const PRODUCTS: Record<string, { name: string; unitPrice: number | null; stock?: number }> = {
  "shine-muscat-3kg": { name: "고당도 샤인머스켓 3kg", unitPrice: 45000 },
  "sweet-potato-5kg": { name: "고구마 1박스 5kg", unitPrice: null },
  "potato-5kg": { name: "감자 1박스 5kg", unitPrice: null },
  "radish-one": { name: "무 1개", unitPrice: 3000, stock: 10 },
  "beef-dashida-500g": { name: "쇠고기 다시다 500g", unitPrice: 11000, stock: 10 },
};

export async function GET() {
  const user = await getGoogleUser();
  if (!user || !(await isMaster(user.id))) {
    return NextResponse.json({ error: "Master만 주문 내역을 확인할 수 있어요." }, { status: 403 });
  }
  const orders = await getDb().select().from(marketOrders).orderBy(desc(marketOrders.createdAt), desc(marketOrders.id));
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const productId = clean(body?.productId, 40);
  const product = PRODUCTS[productId];
  const quantity = Number(body?.quantity);
  const customerName = clean(body?.customerName, 30);
  const roomNumber = clean(body?.roomNumber, 20);
  const bedNumber = clean(body?.bedNumber, 20);
  const phone = clean(body?.phone, 20);
  const phoneDigits = phone.replace(/\D/g, "");

  if (!product) return NextResponse.json({ error: "주문할 상품을 다시 선택해 주세요." }, { status: 400 });
  if (product.unitPrice === null) return NextResponse.json({ error: "가격이 확정된 뒤 주문할 수 있어요." }, { status: 409 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ error: "주문 수량은 1개에서 20개 사이로 입력해 주세요." }, { status: 400 });
  if (!customerName || !roomNumber || !bedNumber || phoneDigits.length < 9 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "주문자, 방 번호, 침대 번호, 전화번호를 정확히 입력해 주세요." }, { status: 400 });
  }

  const db = getDb();
  if (product.stock) {
    const reserved = await db.select({ quantity: sql<number>`coalesce(sum(${marketOrders.quantity}), 0)` }).from(marketOrders).where(eq(marketOrders.productId, productId));
    if (Number(reserved[0]?.quantity ?? 0) + quantity > product.stock) {
      return NextResponse.json({ error: "남은 예정 수량보다 많이 주문할 수 없어요." }, { status: 409 });
    }
  }

  const user = await getGoogleUser();
  const created = await db.insert(marketOrders).values({
    userId: user?.id ?? null,
    productId,
    productName: product.name,
    unitPrice: product.unitPrice,
    quantity,
    customerName,
    roomNumber,
    bedNumber,
    phone,
    status: "payment_pending",
  }).returning({ id: marketOrders.id, status: marketOrders.status });

  return NextResponse.json({ order: { ...created[0], totalPrice: product.unitPrice * quantity } });
}

export async function PATCH(request: Request) {
  const user = await getGoogleUser();
  if (!user || !(await isMaster(user.id))) {
    return NextResponse.json({ error: "Master만 입금을 확인할 수 있어요." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "주문 번호가 올바르지 않아요." }, { status: 400 });

  const updated = await getDb().update(marketOrders)
    .set({ status: "completed", confirmedAt: new Date() })
    .where(eq(marketOrders.id, id))
    .returning({ id: marketOrders.id, status: marketOrders.status, confirmedAt: marketOrders.confirmedAt });
  if (!updated.length) return NextResponse.json({ error: "주문을 찾지 못했어요." }, { status: 404 });
  return NextResponse.json({ order: updated[0] });
}

async function isMaster(userId: string) {
  const rows = await getDb().select({ memberType: users.memberType }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.memberType === "master";
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
