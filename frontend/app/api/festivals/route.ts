import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { festivalSchedules } from "../../../db/schema";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(festivalSchedules).orderBy(asc(festivalSchedules.name));
  return NextResponse.json({
    festivals: rows,
    policy: {
      publish: "서로 다른 출처 2곳이 같은 일정일 때만 자동 반영",
      pending: "새 공지 또는 기존 일정 변경은 검수 대기로 표시",
      staleAfterDays: 30,
    },
  });
}
