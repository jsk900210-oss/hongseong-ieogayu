import { NextResponse } from "next/server";

const CAMPING_NAMES = ["내포캠핑스퀘어2", "캠핑 굄성", "세울터 오토캠핑장", "더선셋 캠핑장"];
const HONGSEONG = { west: 126.426, east: 126.773, south: 36.458, north: 36.673 };

type KakaoPlace = { id: string; place_name: string; category_name: string; x: string; y: string };

export async function GET() {
  const apiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "캠핑장 지도 연결을 준비 중이에요." }, { status: 503 });
  try {
    const results = await Promise.all(CAMPING_NAMES.map(async (name) => {
      const params = new URLSearchParams({ query: `홍성 ${name}`, size: "1" });
      const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, { headers: { Authorization: `KakaoAK ${apiKey}` } });
      if (!response.ok) return null;
      const body = await response.json() as { documents?: KakaoPlace[] };
      const place = body.documents?.[0];
      if (!place) return null;
      const lat = Number(place.y); const lon = Number(place.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < HONGSEONG.south || lat > HONGSEONG.north || lon < HONGSEONG.west || lon > HONGSEONG.east) return null;
      return { id: `camping:${place.id}`, name: place.place_name, category: place.category_name || "캠핑장", icon: "⛺", lat, lon };
    }));
    return NextResponse.json({ places: results.filter((place): place is NonNullable<typeof place> => Boolean(place)), source: "kakao_local" }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "캠핑장 위치를 불러오지 못했어요." }, { status: 502 });
  }
}
