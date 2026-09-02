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
      memberType: users.memberType,
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
    | { displayName?: unknown; memberType?: unknown; masterCode?: unknown; cohortCode?: unknown; stayPeriod?: unknown; interests?: unknown; profileVisibility?: unknown; completeOnboarding?: unknown }
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
  const memberType = body?.memberType === "master" || body?.memberType === "friends" ? body.memberType : "general";
  const masterCode = typeof body?.masterCode === "string" ? body.masterCode.trim() : "";
  const cohortCode = typeof body?.cohortCode === "string" ? body.cohortCode.trim().toUpperCase() : "";
  const stayPeriod = typeof body?.stayPeriod === "string" ? body.stayPeriod.trim() : "";
  const interests = Array.isArray(body?.interests)
    ? body.interests.filter((item): item is string => typeof item === "string").slice(0, 5).join(",")
    : "";
  const profileVisibility = body?.profileVisibility === "public" ? "public" : "mates";

  if (isOnboarding && (!stayPeriod || !interests)) {
    return NextResponse.json({ error: "체류 계획과 관심사를 모두 입력해 주세요." }, { status: 400 });
  }
  const allowedMasterCodes = (process.env.MASTER_ACCESS_CODES ?? (process.env.NODE_ENV === "development" ? "MASTER-LOCAL" : ""))
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  if (isOnboarding && memberType === "master" && allowedMasterCodes.length === 0) {
    return NextResponse.json({ error: "Master 인증 코드가 설정되지 않았어요." }, { status: 503 });
  }
  if (isOnboarding && memberType === "master" && !allowedMasterCodes.includes(masterCode.toUpperCase())) {
    return NextResponse.json({ error: "Master 인증 코드가 올바르지 않아요." }, { status: 403 });
  }

  const update = isOnboarding
    ? { displayName: displayName || user.displayName, memberType, cohortCode, stayPeriod, interests, profileVisibility, onboardingCompletedAt: new Date(), updatedAt: new Date() }
    : { displayName, updatedAt: new Date() };

  await getDb()
    .update(users)
    .set(update)
    .where(eq(users.id, user.id));

  return NextResponse.json({ displayName: displayName || user.displayName, onboardingCompleted: isOnboarding });
}

