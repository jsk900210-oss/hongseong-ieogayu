import { and, desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getDb } from "../../../../db";
import { festivalSchedules, festivalVerificationRuns } from "../../../../db/schema";

type Observation = {
  festivalId: string;
  name: string;
  season?: string;
  location?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  sourceName: string;
  sourceUrl: string;
  contactPhone?: string;
  evidence?: string;
  cancelled?: boolean;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validObservation = (row: unknown): row is Observation => {
  if (!row || typeof row !== "object") return false;
  const item = row as Record<string, unknown>;
  return typeof item.festivalId === "string" && typeof item.name === "string" && typeof item.sourceName === "string" && typeof item.sourceUrl === "string"
    && (!item.startDate || typeof item.startDate === "string" && datePattern.test(item.startDate))
    && (!item.endDate || typeof item.endDate === "string" && datePattern.test(item.endDate));
};

export async function POST(request: Request) {
  const expectedToken = (env as Record<string, string | undefined>).FESTIVAL_AGENT_TOKEN;
  if (!expectedToken || request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "축제 검수 에이전트 인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { observations?: unknown[] } | null;
  const observations = (body?.observations ?? []).filter(validObservation);
  if (!observations.length) return NextResponse.json({ error: "검수할 축제 공지 정보가 없습니다." }, { status: 400 });

  const db = getDb();
  const now = new Date();
  const results: Array<{ id: string; action: "published" | "pending" | "cancelled" }> = [];

  for (const observation of observations) {
    const existing = await db.select().from(festivalSchedules).where(eq(festivalSchedules.id, observation.festivalId)).limit(1);
    if (!existing.length) {
      await db.insert(festivalSchedules).values({
        id: observation.festivalId, name: observation.name, season: observation.season ?? "", location: observation.location ?? "", description: observation.description ?? "",
        sourceName: observation.sourceName, sourceUrl: observation.sourceUrl, contactPhone: observation.contactPhone ?? "", lastCheckedAt: now, updatedAt: now,
      });
    }
    const isSameAsPublic = existing[0]?.startDate === (observation.startDate ?? null) && existing[0]?.endDate === (observation.endDate ?? null);
    await db.insert(festivalVerificationRuns).values({
      festivalId: observation.festivalId,
      sourceName: observation.sourceName,
      sourceUrl: observation.sourceUrl,
      observedStartDate: observation.startDate ?? null,
      observedEndDate: observation.endDate ?? null,
      observedStatus: observation.cancelled ? "cancelled" : "found",
      evidence: observation.evidence?.slice(0, 1000) ?? "",
      checkedAt: now,
    });

    const matchingSources = observation.cancelled ? [] : await db.select({ sourceUrl: festivalVerificationRuns.sourceUrl })
      .from(festivalVerificationRuns)
      .where(and(eq(festivalVerificationRuns.festivalId, observation.festivalId), eq(festivalVerificationRuns.observedStartDate, observation.startDate ?? null), eq(festivalVerificationRuns.observedEndDate, observation.endDate ?? null), eq(festivalVerificationRuns.observedStatus, "found")))
      .orderBy(desc(festivalVerificationRuns.checkedAt));
    const independentSources = new Set(matchingSources.map((source) => source.sourceUrl)).size;
    const publish = observation.cancelled || isSameAsPublic || independentSources >= 2;
    const scheduleStatus = observation.cancelled ? "cancelled" : publish ? "confirmed" : "unconfirmed";
    const verificationStatus = observation.cancelled ? "confirmed" : publish ? "verified" : "pending";

    if (existing.length) {
      await db.update(festivalSchedules).set({
        ...(publish ? { startDate: observation.startDate ?? null, endDate: observation.endDate ?? null } : {}),
        scheduleStatus,
        verificationStatus,
        sourceName: observation.sourceName,
        sourceUrl: observation.sourceUrl,
        contactPhone: observation.contactPhone ?? existing[0].contactPhone,
        lastCheckedAt: now,
        updatedAt: now,
      }).where(eq(festivalSchedules.id, observation.festivalId));
    } else {
      await db.update(festivalSchedules).set({
        startDate: publish ? observation.startDate ?? null : null, endDate: publish ? observation.endDate ?? null : null,
        scheduleStatus, verificationStatus, sourceName: observation.sourceName, sourceUrl: observation.sourceUrl,
        contactPhone: observation.contactPhone ?? "", lastCheckedAt: now, updatedAt: now,
      }).where(eq(festivalSchedules.id, observation.festivalId));
    }
    results.push({ id: observation.festivalId, action: observation.cancelled ? "cancelled" : publish ? "published" : "pending" });
  }
  return NextResponse.json({ checkedAt: now.toISOString(), results });
}
