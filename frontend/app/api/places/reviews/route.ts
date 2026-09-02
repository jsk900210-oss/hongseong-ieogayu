import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { placeReviews, places, users } from "../../../../db/schema";
import { getGoogleUser } from "../../../google-auth";

export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("placeId")?.trim();
  if (!placeId) return NextResponse.json({ error: "장소가 필요합니다." }, { status: 400 });
  const rows = await getDb().select({
    id: placeReviews.id, rating: placeReviews.rating, body: placeReviews.body,
    visitedAt: placeReviews.visitedAt, createdAt: placeReviews.createdAt,
    author: users.displayName,
  }).from(placeReviews).innerJoin(users, eq(placeReviews.userId, users.id))
    .where(eq(placeReviews.placeId, placeId)).orderBy(desc(placeReviews.createdAt));
  return NextResponse.json({ reviews: rows });
}

export async function POST(request: Request) {
  const user = await getGoogleUser();
  if (!user) return NextResponse.json({ error: "기수 인증 참가자만 리뷰를 남길 수 있어요." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const placeId = typeof body?.placeId === "string" ? body.placeId.trim() : "";
  const reviewBody = typeof body?.body === "string" ? body.body.trim().slice(0, 500) : "";
  const rating = Number(body?.rating);
  const visitedAt = new Date(typeof body?.visitedAt === "string" ? `${body.visitedAt}T00:00:00+09:00` : "");
  if (!placeId || reviewBody.length < 10 || !Number.isInteger(rating) || rating < 1 || rating > 5 || Number.isNaN(visitedAt.getTime())) {
    return NextResponse.json({ error: "방문일, 별점과 10자 이상의 리뷰를 입력해 주세요." }, { status: 400 });
  }
  const db = getDb();
  const exists = await db.select({ id: places.id }).from(places).where(eq(places.id, placeId)).limit(1);
  if (!exists.length) return NextResponse.json({ error: "등록되지 않은 장소입니다." }, { status: 404 });
  const duplicate = await db.select({ id: placeReviews.id }).from(placeReviews)
    .where(and(eq(placeReviews.placeId, placeId), eq(placeReviews.userId, user.id), eq(placeReviews.visitedAt, visitedAt))).limit(1);
  if (duplicate.length) return NextResponse.json({ error: "같은 방문일의 리뷰가 이미 있어요." }, { status: 409 });
  const created = await db.insert(placeReviews).values({ placeId, userId: user.id, rating, body: reviewBody, visitedAt }).returning({ id: placeReviews.id });
  return NextResponse.json({ id: created[0].id }, { status: 201 });
}
