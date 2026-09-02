import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";
import { getGoogleUser } from "../../google-auth";

export async function GET() {
  const user = await getGoogleUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const profile = await getDb()
    .select({
      displayName: users.displayName,
      cohortCode: users.cohortCode,
      stayPeriod: users.stayPeriod,
      interests: users.interests,
      profileVisibility: users.profileVisibility,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json({ profile: profile[0] ?? null });
}

export async function PATCH(request: Request) {
  const user = await getGoogleUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { displayName?: unknown; cohortCode?: unknown; stayPeriod?: unknown; interests?: unknown; profileVisibility?: unknown; completeOnboarding?: unknown }
    | null;
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";

  if (displayName && (displayName.length < 2 || displayName.length > 20)) {
    return NextResponse.json(
      { error: "닉네임은 2자 이상 20자 이하로 입력해 주세요." },
      { status: 400 },
    );
  }

  const isOnboarding = body?.completeOnboarding === true;
  const cohortCode = typeof body?.cohortCode === "string" ? body.cohortCode.trim().toUpperCase() : "";
  const stayPeriod = typeof body?.stayPeriod === "string" ? body.stayPeriod.trim() : "";
  const interests = Array.isArray(body?.interests)
    ? body.interests.filter((item): item is string => typeof item === "string").slice(0, 5).join(",")
    : "";
  const profileVisibility = body?.profileVisibility === "public" ? "public" : "mates";

  if (isOnboarding && (!/^HS-\d{2}-\d{2}$/.test(cohortCode) || !stayPeriod || !interests)) {
    return NextResponse.json({ error: "기수 코드, 체류 기간, 관심사를 모두 입력해 주세요." }, { status: 400 });
  }
  const allowedCohorts = (process.env.COHORT_CODES ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  if (isOnboarding && allowedCohorts.length === 0) {
    return NextResponse.json({ error: "아직 참가자 기수 코드가 설정되지 않았어요. 운영자에게 문의해 주세요." }, { status: 503 });
  }
  if (isOnboarding && !allowedCohorts.includes(cohortCode)) {
    return NextResponse.json({ error: "유효하지 않은 기수 코드예요. 안내받은 코드를 다시 확인해 주세요." }, { status: 403 });
  }

  const update = isOnboarding
    ? { displayName: displayName || user.displayName, cohortCode, stayPeriod, interests, profileVisibility, onboardingCompletedAt: new Date(), updatedAt: new Date() }
    : { displayName, updatedAt: new Date() };

  await getDb()
    .update(users)
    .set(update)
    .where(eq(users.id, user.id));

  return NextResponse.json({ displayName: displayName || user.displayName, onboardingCompleted: isOnboarding });
}

