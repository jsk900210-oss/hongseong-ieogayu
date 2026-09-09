import { NextResponse } from "next/server";

type CategoryKey = "mart" | "convenience" | "bakery" | "cafe" | "restaurant" | "hospital" | "pharmacy" | "bank" | "fuel" | "public" | "laundry";
type KakaoDocument = {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
};

const CATEGORY_SEARCH: Record<CategoryKey, { categoryCode?: string; keyword?: string }> = {
  mart: { keyword: "마트" },
  convenience: { categoryCode: "CS2" },
  bakery: { keyword: "빵집" },
  cafe: { categoryCode: "CE7" },
  restaurant: { categoryCode: "FD6" },
  hospital: { categoryCode: "HP8" },
  pharmacy: { categoryCode: "PM9" },
  bank: { categoryCode: "BK9" },
  fuel: { categoryCode: "OL7" },
  public: { categoryCode: "PO3" },
  laundry: { keyword: "세탁소" },
};
const HONGSEONG = { west: 126.426, east: 126.773, south: 36.458, north: 36.673 };

const inHongseong = (lat: number, lon: number) => lon >= HONGSEONG.west && lon <= HONGSEONG.east && lat >= HONGSEONG.south && lat <= HONGSEONG.north;

async function search(categoryKey: CategoryKey, lat: number, lon: number, radius: number, apiKey: string, pages = 1) {
  const config = CATEGORY_SEARCH[categoryKey];
  const categorySearch = Boolean(config.categoryCode);
  const endpoint = categorySearch ? "https://dapi.kakao.com/v2/local/search/category.json" : "https://dapi.kakao.com/v2/local/search/keyword.json";
  const rows = await Promise.all(Array.from({ length: pages }, async (_, index) => {
    const params = new URLSearchParams({ x: String(lon), y: String(lat), radius: String(radius), sort: "distance", size: "15", page: String(index + 1) });
    if (config.categoryCode) params.set("category_group_code", config.categoryCode);
    if (config.keyword) params.set("query", config.keyword);
    const response = await fetch(`${endpoint}?${params}`, { headers: { Authorization: `KakaoAK ${apiKey}` } });
    if (!response.ok) throw new Error(`Kakao Local API ${response.status}`);
    const body = await response.json() as { documents?: KakaoDocument[] };
    return body.documents ?? [];
  }));
  return rows.flat().map((place) => ({
    id: `${categoryKey}:${place.id}`,
    name: place.place_name,
    category: place.category_name || categoryKey,
    categoryKey,
    address: place.address_name,
    roadAddress: place.road_address_name,
    phone: place.phone,
    lat: Number(place.y),
    lon: Number(place.x),
    distance: place.distance ? Number(place.distance) : null,
    url: place.place_url,
  })).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon) && inHongseong(place.lat, place.lon));
}

export async function GET(request: Request) {
  const apiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "카카오 장소 검색 키가 아직 등록되지 않았어요." }, { status: 503 });

  const params = new URL(request.url).searchParams;
  const category = params.get("category") ?? "all";
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const radius = Math.min(5000, Math.max(500, Number(params.get("radius")) || 3000));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inHongseong(lat, lon)) {
    return NextResponse.json({ error: "홍성군 안의 검색 중심을 선택해 주세요." }, { status: 400 });
  }
  if (category !== "all" && !(category in CATEGORY_SEARCH)) {
    return NextResponse.json({ error: "지원하지 않는 장소 분류입니다." }, { status: 400 });
  }

  try {
    const keys = category === "all" ? Object.keys(CATEGORY_SEARCH) as CategoryKey[] : [category as CategoryKey];
    const rows = (await Promise.all(keys.map((key) => search(key, lat, lon, radius, apiKey, category === "all" ? 3 : 2)))).flat();
    const unique = [...new Map(rows.map((place) => [place.url || place.id.split(":")[1], place])).values()]
      .sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 120);
    return NextResponse.json({ places: unique, source: "kakao_local", center: { lat, lon }, radius }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("nearby place search failed", error);
    return NextResponse.json({ error: "카카오 장소 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
