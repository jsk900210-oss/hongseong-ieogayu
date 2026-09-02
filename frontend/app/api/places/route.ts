import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { places } from "../../../db/schema";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category");
  const db = getDb();
  const rows = category && category !== "all"
    ? await db.select().from(places).where(eq(places.category, category)).orderBy(asc(places.name))
    : await db.select().from(places).orderBy(asc(places.category), asc(places.name));
  return NextResponse.json({ places: rows });
}

