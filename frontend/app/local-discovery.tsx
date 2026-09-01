"use client";

import { useMemo, useState } from "react";
import markets from "../../data/hongseong/markets.json";
import festivals from "../../data/hongseong/festivals.json";

type DiscoveryView = "around" | "markets" | "festivals" | "reviews";
type Review = { id: number; place: string; category: string; menu: string; rating: number; body: string; author: string; visitedAt: string };

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

export default function LocalDiscovery({ displayName, signedIn, onRequireLogin }: { displayName: string; signedIn: boolean; onRequireLogin: () => void }) {
  const [view, setView] = useState<DiscoveryView>("around");
  const [reviews, setReviews] = useState(seedReviews);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ place: "", category: "한식", menu: "", rating: 5, body: "", visitedAt: "" });
  const today = useMemo(() => new Date(), []);

  const saveReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviews((current) => [{ id: Date.now(), ...draft, author: displayName || "홍성메이트" }, ...current]);
    setDraft({ place: "", category: "한식", menu: "", rating: 5, body: "", visitedAt: "" });
    setCreating(false);
  };

  return <section className="subpage shell local-discovery">
    <span className="eyebrow">LOCAL LIFE · HONGSEONG</span>
    <h1>오늘의 홍성을 발견해요</h1>
    <p className="lead">장날과 축제 소식을 챙기고, 참가자가 직접 찾은 맛을 함께 기록해요.</p>
    <div className="discovery-tabs" role="tablist" aria-label="발견 메뉴">
      {([['around','근처 장소','🗺️'],['markets','오일장','🏮'],['festivals','축제','🎉'],['reviews','메이트 맛집','🥣']] as const).map(([key,label,icon]) =>
        <button key={key} role="tab" aria-selected={view === key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{icon}</span>{label}</button>)}
    </div>

    {view === "around" && <div className="map-panel"><div className="real-map location-pending"><div className="map-placeholder"><span className="brand-mark">이</span><b>구옥 스테이 위치 미정</b><small>위치가 정해지면 반경 2km의 장소를 지도에서 보여드려요</small></div></div><div className="result-list"><div className="result-head"><b>홍성 대표 장소</b><span>거리·경로는 위치 확정 후 표시</span></div>{[["남당항","해산물","🦀"],["홍성전통시장","전통시장 · 오일장","🏮"],["홍주읍성","역사 산책","🏯"],["용봉산","등산로 · 초보자 가능","⛰️"]].map((place)=><button key={place[0]}><span className="place-icon mint">{place[2]}</span><span><small>{place[1]}</small><b>{place[0]}</b><p>홍성메이트에서 가볍게 다녀오기 좋은 곳</p></span></button>)}</div></div>}

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
