import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { joins, users } from "../../../../db/schema";
import { getGoogleUser } from "../../../google-auth";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getGoogleUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "잘못된 Join입니다." }, { status: 400 });

  const db = getDb();
  const [join, viewer] = await Promise.all([
    db.select({ ownerId: joins.ownerId }).from(joins).where(eq(joins.id, id)).limit(1),
    db.select({ memberType: users.memberType }).from(users).where(eq(users.id, user.id)).limit(1),
  ]);
  if (!join[0]) return NextResponse.json({ error: "이미 삭제되었거나 없는 Join입니다." }, { status: 404 });
  if (join[0].ownerId !== user.id && viewer[0]?.memberType !== "master") {
    return NextResponse.json({ error: "내가 만든 Join만 삭제할 수 있어요." }, { status: 403 });
  }

  await db.delete(joins).where(and(eq(joins.id, id), eq(joins.ownerId, join[0].ownerId)));
  return NextResponse.json({ deleted: true });
}
