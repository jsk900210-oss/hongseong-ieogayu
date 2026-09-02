import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../../db";
import { joinMessages, joinParticipants, joins, users } from "../../../../../db/schema";
import { getGoogleUser } from "../../../../google-auth";

async function canAccess(joinId: number, userId: string) {
  const db = getDb();
  const hosted = await db.select({ id: joins.id }).from(joins).where(and(eq(joins.id, joinId), eq(joins.ownerId, userId))).limit(1);
  if (hosted.length) return true;
  const participant = await db.select({ joinId: joinParticipants.joinId }).from(joinParticipants)
    .where(and(eq(joinParticipants.joinId, joinId), eq(joinParticipants.userId, userId), eq(joinParticipants.status, "신청"))).limit(1);
  return participant.length > 0;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getGoogleUser();
  const joinId = Number((await params).id);
  if (!user) return NextResponse.json({ error: "로그인 후 채팅을 확인할 수 있어요." }, { status: 401 });
  if (!Number.isInteger(joinId) || !(await canAccess(joinId, user.id))) return NextResponse.json({ error: "Join 참여자만 채팅을 볼 수 있어요." }, { status: 403 });

  const db = getDb();
  const messages = await db.select({ id: joinMessages.id, body: joinMessages.body, createdAt: joinMessages.createdAt, userId: joinMessages.userId, displayName: users.displayName })
    .from(joinMessages).innerJoin(users, eq(joinMessages.userId, users.id)).where(eq(joinMessages.joinId, joinId)).orderBy(asc(joinMessages.createdAt), asc(joinMessages.id));
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getGoogleUser();
  const joinId = Number((await params).id);
  if (!user) return NextResponse.json({ error: "로그인 후 메시지를 보낼 수 있어요." }, { status: 401 });
  if (!Number.isInteger(joinId) || !(await canAccess(joinId, user.id))) return NextResponse.json({ error: "Join 참여자만 메시지를 보낼 수 있어요." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { body?: unknown } | null;
  const body = typeof payload?.body === "string" ? payload.body.trim().slice(0, 500) : "";
  if (!body) return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
  const db = getDb();
  const created = await db.insert(joinMessages).values({ joinId, userId: user.id, body }).returning({ id: joinMessages.id, body: joinMessages.body, createdAt: joinMessages.createdAt, userId: joinMessages.userId });
  const author = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, user.id)).limit(1);
  return NextResponse.json({ message: { ...created[0], displayName: author[0]?.displayName ?? "참가자" } });
}
