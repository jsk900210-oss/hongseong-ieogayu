"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import markets from "../../data/hongseong/markets.json";
import festivals from "../../data/hongseong/festivals.json";

type DiscoveryView = "around" | "markets" | "festivals" | "reviews" | "recommended" | "hikes";
type Review = { id: number; place: string; category: string; menu: string; rating: number; body: string; author: string; visitedAt: string };
type UserLocation = { lat: number; lon: number };

const HONGSEONG_CENTER: UserLocation = { lat: 36.601, lon: 126.661 };

const PLACES = [
  { name: "남당항", category: "대하 · 새조개", icon: "🦐", lat: 36.537983719, lon: 126.4710062376 },
  { name: "홍성스카이타워(속동전망대)", category: "천수만 전망 · 노을", icon: "🔭", lat: 36.576981901, lon: 126.4646724488 },
  { name: "죽도", category: "섬 트레킹 · 대나무숲", icon: "🏝️", lat: 36.5193186883, lon: 126.4411594216 },
  { name: "궁리포구", category: "포구 · 해안 드라이브", icon: "⛵", lat: 36.6092, lon: 126.4634 },
  { name: "어사리 노을공원", category: "노을 · 해안 산책", icon: "🌅", lat: 36.554, lon: 126.464 },
  { name: "홍성전통시장", category: "전통시장 · 오일장", icon: "🏮", lat: 36.6021991708, lon: 126.6680367636 },
  { name: "홍주읍성", category: "역사 산책", icon: "🏯", lat: 36.5997465556, lon: 126.661159671 },
  { name: "홍주의사총", category: "항일의병 역사", icon: "🕯️", lat: 36.6048297, lon: 126.6708805 },
  { name: "용봉산", category: "등산로 · 초보자 가능", icon: "⛰️", lat: 36.643, lon: 126.650 },
  { name: "오서산", category: "억새 · 산행", icon: "🌾", lat: 36.4584461024, lon: 126.6595135681 },
  { name: "만해 한용운 선생 생가지", category: "독립운동 · 문학", icon: "📜", lat: 36.526, lon: 126.688 },
  { name: "백야 김좌진 장군 생가지", category: "독립운동 · 역사", icon: "🇰🇷", lat: 36.5979059102, lon: 126.5471394517 },
  { name: "고암 이응노 생가기념관", category: "미술관 · 생가", icon: "🎨", lat: 36.62232225, lon: 126.6316666 },
  { name: "그림같은수목원", category: "수목원 · 계절 산책", icon: "🌳", lat: 36.532, lon: 126.696 },
  { name: "결성농요농사박물관", category: "농경문화 · 박물관", icon: "🧺", lat: 36.526, lon: 126.548 },
  { name: "집단지성 · 홍고통 거리", category: "청년마을 · 로컬창업", icon: "🌱", lat: 36.590, lon: 126.660, special: true },
  { name: "문당환경농업마을", category: "유기농업 · 농촌체험", icon: "🌾", lat: 36.556, lon: 126.687, special: true },
];

const HONGSEONG_BOUNDS = { west: 126.426, east: 126.773, south: 36.458, north: 36.673 };
const SPECIAL_ZONES = [
  { id: "startup", name: "홍고통 로컬창업 생활권", shortName: "로컬창업", color: "burgundy", hex: "#8d463a", lat: 36.590, lon: 126.660, radius: 2200 },
  { id: "organic", name: "홍동 유기농 공동체 생활권", shortName: "유기농 공동체", color: "green", hex: "#3d8157", lat: 36.556, lon: 126.687, radius: 3000 },
  { id: "marine", name: "남당항 해양관광 생활권", shortName: "해양관광", color: "blue", hex: "#3688a7", lat: 36.538, lon: 126.472, radius: 2800 },
] as const;
const AREA_GUIDES = [
  { name: "서부 해안권", detail: "궁리 · 속동 · 남당항 · 죽도", lat: 36.56, lon: 126.48, color: "#3688a7" },
  { name: "홍성읍 역사권", detail: "홍주읍성 · 의사총 · 전통시장", lat: 36.603, lon: 126.666, color: "#c5533f" },
  { name: "홍북·내포권", detail: "용봉산 · 이응노의 집", lat: 36.638, lon: 126.64, color: "#8d6545" },
  { name: "광천·오서산권", detail: "오서산 · 수목원 · 전통시장", lat: 36.49, lon: 126.655, color: "#bf7b2f" },
  { name: "결성 역사권", detail: "한용운 생가지 · 결성 문화", lat: 36.525, lon: 126.55, color: "#765a9c" },
  { name: "홍동·장곡 농촌권", detail: "유기농 공동체 · 농촌 체험", lat: 36.555, lon: 126.71, color: "#3d8157" },
] as const;
const HIKES = [
  { name: "용봉산", area: "홍북읍", height: "381m", level: "초급~중급", time: "약 2~3시간", icon: "🪨", season: "사계절", point: "기암괴석 · 내포 전망", route: "용봉산 주차장 → 미륵불 → 정상 → 노적봉 → 악귀봉 → 구룡대", start: "용봉산 주차장 안내소", note: "암릉 구간은 비·눈이 올 때 미끄러워요." },
  { name: "오서산", area: "광천읍", height: "791m", level: "중급", time: "약 3~4시간", icon: "🌾", season: "가을 추천", point: "억새 능선 · 서해 조망", route: "상담마을 → 정암사 → 전망대 → 정상 → 원점회귀", start: "상담마을 주차장", note: "능선에 바람이 강해 방풍 재킷을 챙기세요." },
  { name: "백월산", area: "홍성읍·구항면", height: "약 394m", level: "초급~중급", time: "약 2시간", icon: "🌙", season: "봄·가을", point: "홍성읍 조망 · 장군봉", route: "백월산 주차장 → 장군봉 → 정상 → 하늘정원 → 원점회귀", start: "백월산 주차장", note: "짧은 코스지만 일부 경사가 가파릅니다." },
  { name: "봉수산", area: "금마면 동부", height: "약 484m", level: "중급", time: "약 2~3시간", icon: "🔥", season: "봄·가을", point: "봉수대 능선 · 숲길", route: "등산로 입구 → 능선 → 정상 → 원점회귀", start: "현장 안내판 기준", note: "출발 지점별 코스가 달라 현장 안내를 확인하세요." },
  { name: "보개산", area: "구항면", height: "낮은 산", level: "산책형", time: "약 1~2시간", icon: "🌲", season: "봄 추천", point: "거북이마을 · 솔숲", route: "거북이마을 → 솔바람길 → 마을 순환", start: "거북이마을", note: "정상 등정형보다 마을 연계 숲길에 가깝습니다." },
] as const;
const MARKET_POINTS = [
  { name: "홍성전통시장", category: "1·6일 오일장", icon: "🏮", lat: 36.6021991708, lon: 126.6680367636 },
  { name: "광천전통시장", category: "4·9일 오일장", icon: "🏮", lat: 36.5038, lon: 126.6257 },
  { name: "갈산전통시장", category: "3·8일 오일장", icon: "🏮", lat: 36.6028, lon: 126.5487 },
  { name: "결성전통시장", category: "5·10일 오일장", icon: "🏮", lat: 36.5268, lon: 126.5468 },
] as const;
const FESTIVAL_POINTS = [
  { name: "남당항 새조개·대하축제", category: "겨울·가을 먹거리 축제", icon: "🎉", lat: 36.537983719, lon: 126.4710062376 },
  { name: "홍성역사인물·한우축제", category: "홍주읍성 일원", icon: "🎉", lat: 36.5997465556, lon: 126.661159671 },
  { name: "광천김·토굴새우젓 축제", category: "광천전통시장 일원", icon: "🎉", lat: 36.5038, lon: 126.6257 },
] as const;
const HIKE_POINTS = [
  { name: "용봉산", category: "381m · 초급~중급", icon: "🥾", lat: 36.643, lon: 126.65 },
  { name: "오서산", category: "791m · 중급", icon: "🥾", lat: 36.4584461024, lon: 126.6595135681 },
  { name: "백월산", category: "약 394m · 초급~중급", icon: "🥾", lat: 36.594, lon: 126.627 },
  { name: "봉수산", category: "약 484m · 중급", icon: "🥾", lat: 36.622, lon: 126.757 },
] as const;
const REVIEW_POINTS = [
  { name: "홍성전통시장 메이트 맛집", category: "리뷰 1 · 추천 5", icon: "🥣", lat: 36.6021991708, lon: 126.6680367636 },
  { name: "남당항 포구 분식", category: "리뷰 1 · 추천 4", icon: "🥣", lat: 36.537983719, lon: 126.4710062376 },
] as const;
const LIFESTYLE_POINTS: readonly { name: string; category: string; icon: string; lat: number; lon: number }[] = [];
const CATEGORY_LABELS: Record<DiscoveryView, string> = { around: "전체 장소", markets: "오일장", festivals: "축제", reviews: "메이트 추천 맛집", recommended: "메이트 추천 플레이스", hikes: "등산" };
const CATEGORY_DESCRIPTIONS: Record<DiscoveryView, string> = {
  around: "검수된 관광·생활·편의 장소 전체",
  markets: "장날과 위치가 확인된 전통시장",
  festivals: "개최 장소가 확인된 홍성 축제",
  reviews: "음식점·카페·베이커리 등 먹거리 장소",
  recommended: "소품샵·미용실·공방 등 비음식 생활 이용 장소",
  hikes: "등산로와 출발 지점이 확인된 산",
};
const categoryItems = (view: DiscoveryView) => view === "markets" ? MARKET_POINTS : view === "festivals" ? FESTIVAL_POINTS : view === "reviews" ? REVIEW_POINTS : view === "hikes" ? HIKE_POINTS : view === "recommended" ? LIFESTYLE_POINTS : PLACES;

const seedReviews: Review[] = [
  { id: 1, place: "시장 안 작은 국밥집", category: "한식", menu: "소머리국밥", rating: 5, body: "장날 아침에 갔는데 국물이 담백하고 혼자 앉기도 편했어요. 상호보다 시장 동문 쪽 빨간 간판을 찾으세요!", author: "해솔", visitedAt: "2026-08-29" },
  { id: 2, place: "남당항 포구 분식", category: "분식", menu: "해물라면", rating: 4, body: "바다 보고 들어가 따뜻하게 먹기 좋았어요. 양이 많아 둘이 나누기에도 충분해요.", author: "다정", visitedAt: "2026-08-24" },
];

const isMarketDay = (date: Date, days: number[]) => days.includes(date.getDate() === 10 ? 10 : date.getDate() % 10);
const nextMarketDate = (days: number[], from = new Date()) => {
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    if (isMarketDay(candidate, days)) return { date: candidate, offset };
  }
  return null;
};
const formatShortDate = (date: Date) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(date);
const distanceKm = (from: UserLocation, to: { lat: number; lon: number }) => {
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(to.lat - from.lat); const dLon = rad(to.lon - from.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function HongseongMap({ userLocation, items = PLACES, onSelect }: { userLocation: UserLocation; items?: readonly { name: string; category: string; icon: string; lat: number; lon: number; special?: boolean }[]; onSelect?: (name: string) => void }) {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapElement.current) return;
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    void import("leaflet").then((L) => {
      if (disposed || !mapElement.current) return;
      const countyBounds = L.latLngBounds([HONGSEONG_BOUNDS.south, HONGSEONG_BOUNDS.west], [HONGSEONG_BOUNDS.north, HONGSEONG_BOUNDS.east]);
      map = L.map(mapElement.current, {
        zoomControl: true,
        attributionControl: true,
        minZoom: 10,
        maxZoom: 15,
        maxBounds: countyBounds.pad(0.16),
        maxBoundsViscosity: 0.9,
      });
      map.fitBounds(countyBounds, { padding: [12, 12] });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // 실제 홍성군 행정경계를 강조하고 군 바깥 지역은 흐리게 가린다.
      void fetch("/hongseong-boundary-source.json")
        .then((response) => response.json())
        .then((collection: { features: Array<{ properties: { code: string; name: string }; geometry: { type: string; coordinates: number[][][] } }> }) => {
          if (disposed || !map) return;
          const hongseong = collection.features.find((feature) => feature.properties.name === "홍성군" || feature.properties.code === "34360");
          if (!hongseong) return;
          const boundaryRings = hongseong.geometry.coordinates.map((ring) => ring.map(([lon, lat]) => L.latLng(lat, lon)));
          const worldRing = [L.latLng(-90, -180), L.latLng(90, -180), L.latLng(90, 180), L.latLng(-90, 180)];

          L.polygon([worldRing, ...boundaryRings], {
            pane: "overlayPane",
            stroke: false,
            fill: true,
            fillColor: "#fffaf0",
            fillOpacity: 0.58,
            fillRule: "evenodd",
            interactive: false,
          }).addTo(map);
          L.geoJSON(hongseong as never, {
            pane: "overlayPane",
            style: { color: "#c5533f", weight: 5, opacity: 0.95, fill: false, lineCap: "round", lineJoin: "round" },
            interactive: false,
          }).addTo(map);
        })
        .catch(() => undefined);

      SPECIAL_ZONES.forEach((zone) => {
        L.circle([zone.lat, zone.lon], { radius: zone.radius, color: zone.hex, weight: 2, dashArray: "7 6", fillColor: zone.hex, fillOpacity: .18 })
          .bindTooltip(zone.shortName, { permanent: true, direction: "center", className: `leaflet-zone-label ${zone.color}` })
          .addTo(map!);
      });

      AREA_GUIDES.forEach((area) => {
        const guideIcon = L.divIcon({
          className: "leaflet-area-guide-shell",
          html: `<span class="leaflet-area-guide" style="--area-color:${area.color}"><b>${area.name}</b><small>${area.detail}</small></span>`,
          iconSize: [112, 42],
          iconAnchor: [56, 21],
        });
        L.marker([area.lat, area.lon], { icon: guideIcon, interactive: false, zIndexOffset: -200 }).addTo(map!);
      });

      items.forEach((place) => {
        const special = "special" in place && place.special;
        const marker = L.divIcon({
          className: "leaflet-place-icon-shell",
          html: `<span class="leaflet-place-icon${special ? " special" : ""}${place.name === "남당항" ? " namdang" : ""}">${place.icon}</span>`,
          iconSize: place.name === "남당항" ? [49, 38] : [38, 38],
          iconAnchor: place.name === "남당항" ? [24, 34] : [19, 34],
        });
        L.marker([place.lat, place.lon], { icon: marker, title: place.name }).bindTooltip(`${place.name} · ${place.category}`, { direction: "top", offset: [0, -28] }).on("click", () => onSelect?.(place.name)).addTo(map!);
      });

      if (userLocation.lon >= HONGSEONG_BOUNDS.west && userLocation.lon <= HONGSEONG_BOUNDS.east && userLocation.lat >= HONGSEONG_BOUNDS.south && userLocation.lat <= HONGSEONG_BOUNDS.north) {
        L.circleMarker([userLocation.lat, userLocation.lon], { radius: 8, color: "#fff", weight: 4, fillColor: "#2b77e5", fillOpacity: 1 }).bindTooltip("현재 위치").addTo(map);
      }
    });

    return () => { disposed = true; map?.remove(); };
  }, [userLocation, items, onSelect]);

  return <>
    <div ref={mapElement} className="leaflet-map-canvas" aria-label="홍성군 장소 지도" />
    <div className="county-boundary-label">홍성군 생활권</div>
    <div className="special-zone-legend"><b>특화생활권</b>{SPECIAL_ZONES.map((zone) => <span key={zone.id}><i className={zone.color} />{zone.shortName}</span>)}<small>프로그램 활용 범위 · 공식 행정경계 아님</small></div>
    <div className="gps-map-badge"><span>●</span> 홍성군 전체 · 내 위치 기준 거리</div>
  </>;
}

function CategoryMapPanel({ view }: { view: DiscoveryView }) {
  const items = useMemo(() => categoryItems(view), [view]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  useEffect(() => setSelectedName(null), [view]);
  const orderedItems = useMemo(() => selectedName ? [...items].sort((a, b) => a.name === selectedName ? -1 : b.name === selectedName ? 1 : 0) : items, [items, selectedName]);
  return <div className="map-category-panel"><p className="category-filter-note"><b>{CATEGORY_LABELS[view]}</b>{CATEGORY_DESCRIPTIONS[view]}</p><div className="map-panel"><div className="real-map gps-map gps-active"><HongseongMap userLocation={HONGSEONG_CENTER} items={items} onSelect={setSelectedName} /></div><aside className="result-list ranked-place-list"><div className="result-head"><b>{selectedName ? "선택한 장소" : CATEGORY_LABELS[view]}</b><span>{selectedName ? "지도에서 선택됨" : "리뷰·추천순"}</span></div><div className="ranked-place-scroll">{orderedItems.length ? orderedItems.map((item, index)=><button key={item.name} className={item.name === selectedName ? "selected-place" : ""} onClick={() => setSelectedName(item.name)}><span className="rank-number">{selectedName && item.name === selectedName ? "✓" : index + 1}</span><span className="place-icon mint">{item.icon}</span><span><small>{item.category}</small><b>{item.name}</b><p>{view === "recommended" ? "메이트가 다시 가고 싶은 생활 장소" : "지도에서 위치를 확인하세요"}</p></span></button>) : <div className="empty-filter-result"><span>🔎</span><b>검수 완료된 장소를 준비 중이에요</b><p>메이트 추천과 운영 여부 검수가 완료되면 지도에 표시됩니다.</p></div>}</div></aside></div></div>;
}

export default function LocalDiscovery({ displayName, signedIn, onRequireLogin }: { displayName: string; signedIn: boolean; onRequireLogin: () => void }) {
  const [view, setView] = useState<DiscoveryView>("around");
  const [reviews, setReviews] = useState(seedReviews);
  const [creating, setCreating] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [draft, setDraft] = useState({ place: "", category: "한식", menu: "", rating: 5, body: "", visitedAt: "" });
  const today = useMemo(() => new Date(), []);

  const saveReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviews((current) => [{ id: Date.now(), ...draft, author: displayName || "홍성메이트" }, ...current]);
    setDraft({ place: "", category: "한식", menu: "", rating: 5, body: "", visitedAt: "" });
    setCreating(false);
  };

  const findMe = () => {
    if (!navigator.geolocation) { setLocationMessage("이 기기에서는 현재 위치를 사용할 수 없어요."); return; }
    setLocating(true); setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setUserLocation({ lat: coords.latitude, lon: coords.longitude }); setLocating(false); },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? "브라우저 주소창에서 위치 권한을 허용해 주세요."
          : error.code === error.TIMEOUT
            ? "노트북에서 위치 확인이 지연되고 있어요. 다시 시도해 주세요."
            : "현재 위치를 확인하지 못했어요. 네트워크 연결을 확인해 주세요.";
        setLocationMessage(message); setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };

  return <section className="subpage shell local-discovery">
    <span className="eyebrow">LOCAL LIFE · HONGSEONG</span>
    <h1>오늘의 홍성을 발견해요</h1>
    <p className="lead">장날과 축제 소식을 챙기고, 참가자가 직접 찾은 맛을 함께 기록해요.</p>
    <div className="discovery-tabs" role="tablist" aria-label="발견 메뉴">
      {([['around','전체 장소','🗺️'],['markets','오일장','🏮'],['festivals','축제','🎉'],['reviews','메이트 추천 맛집','🥣'],['recommended','메이트 추천 플레이스','💚'],['hikes','등산','🥾']] as const).map(([key,label,icon]) =>
        <button key={key} role="tab" aria-selected={view === key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{icon}</span>{label}</button>)}
    </div>
    <CategoryMapPanel view={view} />

    {view === "around" && <div className="map-panel"><div className={`real-map gps-map ${userLocation ? "gps-active" : "location-pending"}`}>{userLocation ? <HongseongMap userLocation={userLocation} /> : <div className="map-placeholder"><span className="brand-mark">이</span><b>내 위치에서 홍성을 발견해요</b><small>노트북은 Wi-Fi 기반 위치를 사용하며, 버튼을 누를 때만 권한을 요청합니다</small><button type="button" className="gps-button" onClick={findMe} disabled={locating}>{locating ? "위치 확인 중…" : "◎ 현재 위치로 보기"}</button>{locationMessage && <><em>{locationMessage}</em><button type="button" className="gps-fallback-button" onClick={() => { setUserLocation(HONGSEONG_CENTER); setLocationMessage(""); }}>홍성읍 기준으로 보기</button></>}</div>}</div><div className="result-list"><div className="result-head"><b>{userLocation ? "내 위치에서 얼마나 걸릴까요?" : `홍성 대표 장소 ${PLACES.length}곳`}</b><span>{userLocation ? `${PLACES.length}곳 · 직선거리 기준` : "위치를 켜면 거리를 표시해요"}</span></div>{PLACES.map((place)=><button key={place.name} className={"special" in place && place.special ? "special-place-row" : ""}><span className="place-icon mint">{place.icon}</span><span><small>{place.category}</small><b>{place.name}</b><p>{userLocation ? `현재 위치에서 약 ${distanceKm(userLocation, place).toFixed(1)}km` : "홍성에서 가볍게 다녀오기 좋은 곳"}</p></span></button>)}</div></div>}

    {view === "markets" && <div className="notice-section"><div className="notice-heading"><div><span className="mini-label">5-DAY MARKET</span><h2>다음 장날, 놓치지 마세요</h2></div><span className="today-chip">오늘 · {formatShortDate(today)}</span></div><div className="market-grid">{markets.map((market) => { const next = nextMarketDate(market.days, today)!; const featured = next.offset <= 7; return <article key={market.id} className={`market-card ${next.offset === 0 ? "today" : featured ? "soon" : ""}`}><div className="market-card-top"><span className="market-icon">🏮</span><span className="market-status">{next.offset === 0 ? "오늘 장날!" : next.offset === 1 ? "내일 열려요" : `D-${next.offset}`}</span></div><small>{market.area} · 매월 {market.days.join("·")}일</small><h3>{market.name}</h3><p>{market.note}</p><div className="market-date"><b>{formatShortDate(next.date)}</b><span>{market.hours}</span></div></article>})}</div><p className="data-note">장 운영 시간은 날씨와 상인회 사정에 따라 달라질 수 있어요.</p></div>}

    {view === "festivals" && <FestivalList today={today} />}

    {view === "reviews" && <div className="notice-section"><div className="review-title-row"><div><span className="mini-label">MATE-ONLY REVIEW</span><h2>검색보다 생생한, 메이트의 한 끼</h2><p>직접 다녀온 참가자의 경험만 차곡차곡 모아요.</p></div><button className="primary" onClick={() => signedIn ? setCreating(true) : onRequireLogin()}>맛집 기록하기 ＋</button></div><div className="review-grid">{reviews.map((review) => <article className="review-card" key={review.id}><div className="review-meta"><span>{review.category}</span><b>{"★".repeat(review.rating)}<i>{"★".repeat(5-review.rating)}</i></b></div><h3>{review.place}</h3><strong>메이트의 픽 · {review.menu}</strong><p>“{review.body}”</p><footer><span className="review-avatar">{review.author.slice(0,1)}</span><span><b>{review.author}</b><small>{review.visitedAt} 방문</small></span><em>직접 방문</em></footer></article>)}</div></div>}

    {creating && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreating(false)}><section className="join-modal review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="닫기" onClick={() => setCreating(false)}>×</button><span className="mini-label">NEW LOCAL REVIEW</span><h2 id="review-title">내가 찾은 홍성 맛집</h2><p>광고가 아닌, 직접 먹어본 경험을 알려주세요.</p><form onSubmit={saveReview}><label>가게 이름 또는 찾는 방법<input required maxLength={60} value={draft.place} onChange={(e)=>setDraft({...draft, place:e.target.value})} placeholder="예: 홍성시장 동문 빨간 간판집" /></label><div className="form-grid"><label>분류<select value={draft.category} onChange={(e)=>setDraft({...draft,category:e.target.value})}><option>한식</option><option>분식</option><option>카페</option><option>해산물</option><option>기타</option></select></label><label>먹어본 메뉴<input required value={draft.menu} onChange={(e)=>setDraft({...draft,menu:e.target.value})} placeholder="가장 추천하는 메뉴" /></label><label>방문일<input required type="date" value={draft.visitedAt} onChange={(e)=>setDraft({...draft,visitedAt:e.target.value})} /></label><label>별점<select value={draft.rating} onChange={(e)=>setDraft({...draft,rating:Number(e.target.value)})}>{[5,4,3,2,1].map((score)=><option key={score} value={score}>{"★".repeat(score)} {score}점</option>)}</select></label></div><label>솔직한 한 줄 리뷰<textarea required minLength={10} maxLength={300} rows={4} value={draft.body} onChange={(e)=>setDraft({...draft,body:e.target.value})} placeholder="누구와 갔는지, 분위기와 팁도 함께 적어주세요" /></label><button className="primary submit-join" type="submit">리뷰 등록하기</button></form></section></div>}
  </section>;
}

function FestivalList({ today }: { today: Date }) {
  const rows = festivals.map((festival) => {
    const start = festival.startDate ? new Date(`${festival.startDate}T00:00:00`) : null;
    const diff = start ? Math.ceil((start.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000) : null;
    return { ...festival, start, diff };
  }).sort((a,b) => a.diff === null ? 1 : b.diff === null ? -1 : a.diff-b.diff);
  return <div className="notice-section"><div className="notice-heading"><div><span className="mini-label">HONGSEONG FESTIVAL</span><h2>계절마다 이어지는 홍성의 축제</h2></div><span className="festival-count">공식 축제 {rows.length}개</span></div><div className="festival-list">{rows.map((festival)=><article key={festival.id} className={festival.diff !== null && festival.diff >= 0 ? "confirmed" : ""}><div className="festival-season">{festival.season}<span>{festival.diff === null ? "일정 확인 중" : festival.diff === 0 ? "D-DAY" : festival.diff > 0 ? `D-${festival.diff}` : "종료"}</span></div><div><small>{festival.location}</small><h3>{festival.name}</h3><p>{festival.description}</p></div><div className="festival-date">{festival.start ? <><b>{new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric"}).format(festival.start)}</b><span>{festival.endDate && festival.endDate !== festival.startDate ? `– ${new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric"}).format(new Date(`${festival.endDate}T00:00:00`))}` : "개최"}</span></> : <><b>날짜 미정</b><span>확정 시 알려드려요</span></>}</div></article>)}</div></div>;
}
