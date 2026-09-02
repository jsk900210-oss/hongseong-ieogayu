import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { placeReports, places } from "../../../../db/schema";
import { getGoogleUser } from "../../../google-auth";

const allowed = new Set(["open_confirmed", "closed_suspected", "wrong_info", "moved"]);

export async function POST(request: Request) {
  const user = await getGoogleUser();
  if (!user) return NextResponse.json({ error: "기수 인증 참가자만 제보할 수 있어요." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const placeId = typeof body?.placeId === "string" ? body.placeId.trim() : "";
  const reportType = typeof body?.reportType === "string" ? body.reportType : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 300) : "";
  if (!placeId || !allowed.has(reportType)) return NextResponse.json({ error: "올바른 제보 유형을 선택해 주세요." }, { status: 400 });
  const db = getDb();
  const exists = await db.select({ id: places.id }).from(places).where(eq(places.id, placeId)).limit(1);
  if (!exists.length) return NextResponse.json({ error: "등록되지 않은 장소입니다." }, { status: 404 });
  const created = await db.insert(placeReports).values({ placeId, userId: user.id, reportType, note }).returning({ id: placeReports.id });
  return NextResponse.json({ id: created[0].id, status: "pending" }, { status: 201 });
}
