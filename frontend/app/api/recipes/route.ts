import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { communityRecipes, users } from "../../../db/schema";
import { getGoogleUser } from "../../google-auth";
import { officialRecipes } from "../../recipe-catalog";

export async function GET() {
  const db = getDb();
  try {
    const community = await db.select({ id: communityRecipes.id, title: communityRecipes.title, ingredient: communityRecipes.ingredient, summary: communityRecipes.summary, sourceName: communityRecipes.sourceName, sourceUrl: communityRecipes.sourceUrl, author: users.displayName }).from(communityRecipes).innerJoin(users, eq(communityRecipes.userId, users.id)).orderBy(desc(communityRecipes.createdAt));
    return NextResponse.json({ recipes: [...community.map((item) => ({ ...item, id: `community-${item.id}`, isCommunity: true })), ...officialRecipes], officialCount: officialRecipes.length });
  } catch { return NextResponse.json({ recipes: officialRecipes, officialCount: officialRecipes.length }); }
}

export async function POST(request: Request) {
  const user = await getGoogleUser();
  if (!user) return NextResponse.json({ error: "로그인 후 레시피를 올릴 수 있어요." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const title = text(body?.title, 70), ingredient = text(body?.ingredient, 40), summary = text(body?.summary, 500), sourceName = text(body?.sourceName, 80), sourceUrl = text(body?.sourceUrl, 500);
  if (!title || !ingredient || !summary) return NextResponse.json({ error: "제목, 재료, 레시피 설명을 입력해 주세요." }, { status: 400 });
  const db = getDb();
  const created = await db.insert(communityRecipes).values({ userId: user.id, title, ingredient, summary, sourceName, sourceUrl }).returning({ id: communityRecipes.id });
  return NextResponse.json({ id: created[0].id });
}
