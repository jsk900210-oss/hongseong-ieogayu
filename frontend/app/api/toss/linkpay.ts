const TOSS_API = "https://api.tosspayments.com";

export type TossOrder = {
  orderKey?: string;
  status?: string;
  amount?: number;
  totalAmount?: number;
  payment?: { status?: string; amount?: number; totalAmount?: number };
  orderItems?: Array<{
    product?: { productKey?: string };
    productKey?: string;
  }>;
};

function authorization() {
  const secret = process.env.TOSS_LINKPAY_SECRET_KEY?.trim();
  if (!secret) return null;
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export function isLinkPayConfigured() {
  return Boolean(authorization());
}

export async function createLinkPayProduct(input: {
  orderId: number;
  name: string;
  amount: number;
}) {
  const auth = authorization();
  if (!auth) return null;

  const response = await fetch(`${TOSS_API}/v1/products`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      "Idempotency-Key": `hongseong-market-${input.orderId}`,
    },
    body: JSON.stringify({
      name: input.name,
      amount: input.amount,
      stock: { quantity: 1 },
      useMemo: true,
      description: `홍성메이트 로컬마켓 주문 #${input.orderId}`,
    }),
  });
  if (!response.ok) throw new Error(`LinkPay product creation failed: ${response.status}`);
  const result = await response.json() as { productKey?: string; url?: string; paymentUrl?: string };
  const paymentUrl = result.url ?? result.paymentUrl;
  if (!result.productKey || !paymentUrl) throw new Error("LinkPay response is missing productKey or URL");
  return { productKey: result.productKey, paymentUrl };
}

export async function fetchLinkPayOrder(orderKey: string): Promise<TossOrder | null> {
  const auth = authorization();
  if (!auth) return null;
  const response = await fetch(`${TOSS_API}/v1/orders/${encodeURIComponent(orderKey)}`, {
    headers: { Authorization: auth },
  });
  if (!response.ok) return null;
  return response.json() as Promise<TossOrder>;
}

export function orderHasProduct(order: TossOrder, productKey: string) {
  return order.orderItems?.some((item) => (item.product?.productKey ?? item.productKey) === productKey) ?? false;
}

export function orderPaymentStatus(order: TossOrder) {
  return order.payment?.status ?? order.status ?? "";
}

export function orderPaidAmount(order: TossOrder) {
  return order.payment?.totalAmount ?? order.payment?.amount ?? order.totalAmount ?? order.amount;
}
