"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GoogleUser } from "./google-auth";
import LocalDiscovery from "./local-discovery";
import HongseongWeather from "./hongseong-weather";
type Tab = "home" | "place" | "join" | "messages" | "profile";
type JoinStatus = "모집중" | "모집완료" | "일정완료";

type JoinItem = {
  id: number;
  title: string;
  keyword: string;
  location: string;
  icon: string;
  date: string;
  time: string;
  max: number;
  people: number;
  status: JoinStatus;
  host: string;
  description: string;
  isOwner?: boolean;
  canDelete?: boolean;
};

type AskResponse = {
  query: string;
  answer: string;
  sources: Array<{
    name: string;
    category_norm: string;
    distance_m: number;
    solo_friendly: boolean | null;
    document: string;
  }>;
};

type ProfileMeta = { interests: string[]; activityScore: number; lastActiveAt: string | null; memberType: "master" | "friends" | "general" | "" };
type JoinMessage = { id: number; body: string; createdAt: string; userId: string; displayName: string };

const ONBOARDING_INTERESTS = ["맛집 탐방", "로컬 창업", "농사·텃밭", "산책·등산", "사진·기록", "함께 요리", "반려동물", "문화·축제"];

export default function ClientHome({ user }: { user: GoogleUser | null }) {
  const [tab, setTab] = useState<Tab>("home");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [nicknameDraft, setNicknameDraft] = useState(user?.displayName ?? "");
  const [editingNickname, setEditingNickname] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta>({ interests: [], activityScore: 30, lastActiveAt: null, memberType: "" });
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [onboardingDraft, setOnboardingDraft] = useState({ memberType: "" as "" | "master" | "friends" | "general", masterCode: "", cohortCode: "", stayPeriod: "2주 체류", stayArea: "", interests: [] as string[], profileVisibility: "private" });
  const [joins, setJoins] = useState<JoinItem[]>([]);
  const [creatingJoin, setCreatingJoin] = useState(false);
  const [savingJoin, setSavingJoin] = useState(false);
  const [joinDraft, setJoinDraft] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    max: "4",
    keyword: "여행",
  });
  const [keyword, setKeyword] = useState("전체");
  const [joined, setJoined] = useState<number[]>([]);
  const [activeChat, setActiveChat] = useState<JoinItem | null>(null);
  const [messages, setMessages] = useState<JoinMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toast, setToast] = useState("");
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askResponse, setAskResponse] = useState<AskResponse | null>(null);
  const keywords = ["전체", ...Array.from(new Set(joins.map((item) => item.keyword)))];
  const scheduledJoins = useMemo(() => [...joins].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [joins]);
  const visible = useMemo(
    () => scheduledJoins.filter((item) => keyword === "전체" || item.keyword === keyword),
    [scheduledJoins, keyword],
  );

  useEffect(() => {
    fetch("/api/joins")
      .then((response) => response.json())
      .then((result: { joins?: Array<JoinItem & { joined?: boolean }> }) => {
        const items = result.joins ?? [];
        setJoins(items);
        setJoined(items.filter((item) => item.joined).map((item) => item.id));
      })
      .catch(() => setToast("Join 목록을 불러오지 못했어요."));
  }, []);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (!authError) return;
    window.history.replaceState({}, "", window.location.pathname);
    setToast(authError === "google_config" ? "Google 연결을 준비 중이에요. 테스트 로그인으로 먼저 확인해 보세요." : "로그인 연결을 다시 확인해 주세요.");
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((result: { profile?: { memberType?: "master" | "friends" | "general"; cohortCode?: string; stayPeriod?: string; stayArea?: string; interests?: string; profileVisibility?: string; activityScore?: number; lastActiveAt?: string | null; onboardingCompletedAt?: string | null } } | null) => {
        const profile = result?.profile;
        if (!profile?.onboardingCompletedAt) setShowOnboarding(true);
        if (profile) setOnboardingDraft({
          memberType: profile.memberType ?? "",
          masterCode: "",
          cohortCode: profile.cohortCode ?? "",
          stayPeriod: profile.stayPeriod || "2주 체류",
          stayArea: profile.stayArea ?? "",
          interests: profile.interests ? profile.interests.split(",").filter(Boolean) : [],
          profileVisibility: profile.profileVisibility ?? "mates",
        });
        if (profile) setProfileMeta({
          interests: profile.interests ? profile.interests.split(",").filter(Boolean).slice(0, 5) : [],
          activityScore: typeof profile.activityScore === "number" ? profile.activityScore : 30,
          lastActiveAt: profile.lastActiveAt ?? null,
          memberType: profile.memberType ?? "",
        });
      })
      .catch(() => undefined);
  }, [user]);

  const move = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveNickname = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingNickname(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: nicknameDraft }),
    });
    const result = (await response.json()) as {
      displayName?: string;
      error?: string;
    };

    setSavingNickname(false);
    if (!response.ok || !result.displayName) {
      setToast(result.error ?? "닉네임을 저장하지 못했어요.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    setDisplayName(result.displayName);
    setNicknameDraft(result.displayName);
    setEditingNickname(false);
    setToast("닉네임을 바꿨어요.");
    window.setTimeout(() => setToast(""), 1800);
  };

  const saveOnboarding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingOnboarding(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName, ...onboardingDraft, completeOnboarding: true }),
    });
    const result = await response.json() as { error?: string };
    setSavingOnboarding(false);
    if (!response.ok) {
      setToast(result.error ?? "참가자 인증을 완료하지 못했어요.");
      return;
    }
    setShowOnboarding(false);
    setProfileMeta((current) => ({ ...current, interests: onboardingDraft.interests, memberType: onboardingDraft.memberType }));
    setToast("기수 인증이 완료됐어요. 홍성에서 만나유!");
    window.setTimeout(() => setToast(""), 2200);
  };

  const toggleInterest = (interest: string) => setOnboardingDraft((current) => ({
    ...current,
    interests: current.interests.includes(interest)
      ? current.interests.filter((item) => item !== interest)
      : current.interests.length < 5 ? [...current.interests, interest] : current.interests,
  }));

  const selectAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setToast("JPG·PNG·WEBP 이미지, 2MB 이하만 올릴 수 있어요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const saveJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      window.location.href = "/api/auth/google?return_to=/";
      return;
    }

    setSavingJoin(true);
    const response = await fetch("/api/joins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(joinDraft),
    });
    const result = (await response.json()) as {
      join?: JoinItem;
      error?: string;
    };
    setSavingJoin(false);

    if (!response.ok || !result.join) {
      setToast(result.error ?? "Join을 등록하지 못했어요.");
      window.setTimeout(() => setToast(""), 2200);
      return;
    }

    setJoins((current) => [result.join!, ...current]);
    setJoinDraft({ title: "", description: "", location: "", date: "", time: "", max: "4", keyword: "여행" });
    setCreatingJoin(false);
    setToast("새 Join이 등록됐어요.");
    window.setTimeout(() => setToast(""), 1800);
  };

  const openChat = async (item: JoinItem) => {
    const response = await fetch(`/api/joins/${item.id}/messages`);
    const result = await response.json() as { messages?: JoinMessage[]; error?: string };
    if (!response.ok) { setToast(result.error ?? "채팅을 열지 못했어요."); return; }
    setMessages(result.messages ?? []);
    setActiveChat(item);
  };

  const toggleJoin = async (item: JoinItem) => {
    if (item.status !== "모집중" || item.isOwner) return;
    const response = await fetch(`/api/joins/${item.id}/participants`, { method: "POST" });
    const result = await response.json() as { joined?: boolean; error?: string };
    if (!response.ok || typeof result.joined !== "boolean") { setToast(result.error ?? "참여 상태를 바꾸지 못했어요."); return; }
    setJoined((current) => result.joined ? [...new Set([...current, item.id])] : current.filter((value) => value !== item.id));
    if (result.joined) { await openChat(item); } else { setToast("참여를 취소했어요. 채팅방도 더 이상 볼 수 없어요."); }
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeChat || !messageDraft.trim()) return;
    setSendingMessage(true);
    const response = await fetch(`/api/joins/${activeChat.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: messageDraft }) });
    const result = await response.json() as { message?: JoinMessage; error?: string };
    setSendingMessage(false);
    if (!response.ok || !result.message) { setToast(result.error ?? "메시지를 보내지 못했어요."); return; }
    setMessages((current) => [...current, result.message!]);
    setMessageDraft("");
  };

  const deleteJoin = async (id: number) => {
    if (!window.confirm("이 Join을 삭제할까요? 참여 신청도 함께 취소됩니다.")) return;
    const response = await fetch(`/api/joins/${id}`, { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setToast(result.error ?? "Join을 삭제하지 못했어요.");
      return;
    }
    setJoins((current) => current.filter((item) => item.id !== id));
    setJoined((current) => current.filter((value) => value !== id));
    setToast("Join을 삭제했어요.");
  };

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!askQuestion.trim()) return;

    setAskLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: askQuestion }),
      });

      if (!response.ok) {
        setToast("질문을 처리하지 못했어요.");
        window.setTimeout(() => setToast(""), 2200);
        setAskLoading(false);
        return;
      }

      const result = (await response.json()) as AskResponse;
      setAskResponse(result);
      setAskQuestion("");
    } catch {
      setToast("질문을 처리하지 못했어요.");
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setAskLoading(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => move("home")}>
          <span className="brand-mark">이</span><span><b>홍성, 이어가유</b><small>LOCAL STAY COMMUNITY</small></span>
        </button>
        <nav className="desktop-nav">
          <button className={tab === "home" ? "active" : ""} onClick={() => move("home")}>홈</button>
          <button className={tab === "place" ? "active" : ""} onClick={() => move("place")}>근처 발견</button>
          <button className={tab === "join" ? "active" : ""} onClick={() => move("join")}>Join</button>
          <button className={tab === "messages" ? "active" : ""} onClick={() => move("messages")}>메시지함</button>
          <button className={tab === "profile" ? "active" : ""} onClick={() => move("profile")}>내 프로필</button>
        </nav>
        {user
          ? <button className="user-chip" onClick={() => move("profile")}><span>👤</span><b>{displayName}</b></button>
          : <a className="topbar-login" href="/api/auth/demo?return_to=/"><span>◎</span> 테스트 로그인</a>}
      </header>

      {tab === "home" && <>
        <section className="hero shell">
          <div className="hero-copy">
            <span className="eyebrow">홍성, 이어가유 · 구옥 스테이</span>
            <h1>홍성에서<br/><em>함께할 순간</em>을 담아요</h1>
            <p>혼자 온 여행자도 금세 친구가 되는 곳.<br/>홍성에 있는 로컬 친구들을 자유롭게 만나보세요.</p>
            <div className="hero-actions"><button className="primary" onClick={() => move("join")}>Join 시작하기 →</button><button className="text-btn" onClick={() => move("place")}>근처 둘러보기</button></div>
          </div>
          <div className="hero-art hongseong-hero" role="img" aria-label="황금 들녘과 홍성 구옥 스테이 풍경"><HongseongWeather /></div>
        </section>
        <section className="join-preview"><div className="shell"><div className="section-heading light"><div><span className="mini-label">JOIN · READY</span><h2>{joins.length > 0 ? "지금 참여할 수 있는 Join" : "첫 Join을 기다리고 있어요"}</h2><p>{joins.length > 0 ? `가장 가까운 일정부터 ${Math.min(joins.length, 3)}개를 확인해 보세요.` : "계정으로 로그인한 뒤 새로운 Join을 만들어보세요."}</p></div><button onClick={() => move("join")}>{joins.length > 0 ? "전체 Join 보기 →" : "Join 만들기 →"}</button></div>{joins.length > 0 && <div className="join-grid">{scheduledJoins.slice(0, 3).map((item) => <JoinCard key={item.id} item={item} joined={joined.includes(item.id)} onJoin={() => toggleJoin(item)} onDelete={() => deleteJoin(item.id)} onChat={() => openChat(item)} />)}</div>}</div></section>
      </>}

      {tab === "place" && <LocalDiscovery displayName={displayName} signedIn={Boolean(user)} onRequireLogin={() => window.location.assign("/api/auth/google?return_to=/")} />}

      {tab === "join" && <section className="subpage shell">
        <div className="join-title-row"><div><span className="eyebrow">JOIN</span><h1>{joins.length}개의 홍성 Join</h1></div><button className="primary" onClick={() => user ? setCreatingJoin(true) : window.location.assign("/api/auth/google?return_to=/")}>Join 만들기 <span>＋</span></button></div>
        <div className="join-filters">{keywords.map((item) => <button key={item} className={keyword === item ? "selected" : ""} onClick={() => setKeyword(item)}>{item}</button>)}</div>
        {visible.length === 0 ? <div className="keyword-panel"><span className="mini-label">EMPTY JOIN</span><h2>등록된 Join이 아직 없어요</h2><p>로그인한 사용자가 첫 Join을 만들면 이곳에 표시됩니다.</p></div> : <div className="join-page-grid">{visible.map((item) => <JoinCard key={item.id} item={item} joined={joined.includes(item.id)} onJoin={() => toggleJoin(item)} onDelete={() => deleteJoin(item.id)} onChat={() => openChat(item)} />)}</div>}
      </section>}

      {tab === "messages" && <section className="subpage shell inbox-page"><span className="eyebrow">JOIN MESSAGE</span><h1>메시지함</h1><p className="lead">참여한 Join과 내가 만든 Join의 채팅방만 볼 수 있어요.</p><div className="inbox-list">{scheduledJoins.filter((item) => item.isOwner || joined.includes(item.id)).map((item) => <button key={item.id} onClick={() => openChat(item)}><span>{item.icon}</span><div><b>{item.title}</b><small>🕒 {item.date} {item.time} · {item.location}</small></div><i>채팅 열기 →</i></button>)}{!scheduledJoins.some((item) => item.isOwner || joined.includes(item.id)) && <p className="inbox-empty">참여한 Join이 아직 없어요. 함께하기를 누르면 이곳에 채팅방이 생겨요.</p>}</div></section>}

      {tab === "profile" && <section className="subpage shell profile-page">
        <div className="profile-head"><button type="button" className="avatar avatar-upload" onClick={() => avatarInputRef.current?.click()} aria-label="프로필 사진 올리기">{avatarPreview ? <img src={avatarPreview} alt="선택한 프로필 사진" /> : "👤"}<i>사진 변경</i></button><input ref={avatarInputRef} className="avatar-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={selectAvatar} /><div><span className="eyebrow">ACCOUNT</span><h1>{displayName || "내 계정 만들기"}</h1><p>{user ? `${user.email} 계정으로 연결되었습니다.` : "로그인 후 서비스 내부 사용자 계정이 자동으로 생성됩니다."}</p><div className="stats"><span><b>0</b> Join</span><span><b>0</b> 신청</span><span><b>0</b> 참여 기록</span></div></div>{user && <div className="profile-actions"><button type="button" onClick={() => setShowOnboarding(true)}>기수 정보</button><button type="button" onClick={() => setEditingNickname(true)}>닉네임 변경</button></div>}</div>
        {user && <section className="profile-insights"><div className="profile-keywords"><span className="mini-label">MY ACTIVITY KEYWORDS</span><h2>대표 활동 키워드</h2><p>관심사와 검수 완료 활동을 바탕으로 최대 5개가 표시됩니다.</p><div>{profileMeta.interests.length ? profileMeta.interests.map((interest) => <span key={interest}>#{interest}</span>) : <em>온보딩에서 관심사를 선택해 주세요.</em>}</div></div><div className="activity-temperature"><span className="mini-label">TRUST TEMPERATURE</span><div className="temperature-head"><div><h2>{profileMeta.activityScore}°</h2><p>{profileMeta.activityScore >= 70 ? "정보 신뢰도가 높아요" : profileMeta.activityScore >= 30 ? "활동을 이어가고 있어요" : "첫 정확한 기록을 기다려요"}</p></div><div className="thermometer" aria-label={`활동 온도 ${profileMeta.activityScore}도`}><i style={{height: `${Math.max(7, Math.min(100, profileMeta.activityScore))}%`}} /></div></div><small>기본 30°에서 시작해요. 검수 완료된 정확한 정보는 올리고, 비매너·고의 허위정보가 확인되면 Master 검수 후 감점됩니다. 이후 폐업·휴업·정보 변경은 갱신 제보로만 처리하며 감점하지 않아요.</small></div></section>}
        <div className="keyword-panel" style={{marginTop: 24}}><div className="panel-title"><div><span className="mini-label">PARTICIPANT ACCOUNT</span><h2>{user ? "참가자 계정 연결 완료" : "참가자로 시작하기"}</h2></div><span className="test-badge">{user ? "로그인됨" : "로그인 필요"}</span></div><p>{user ? "기수 인증 후 Join 생성·신청·방문 기록을 참가자 계정별로 관리합니다." : "로컬 데모에서는 테스트 참가자로 바로 둘러볼 수 있어요. 실제 운영에서는 Google 계정으로 연결합니다."}</p>{user ? <a className="primary" href="/api/auth/logout">로그아웃</a> : <a className="primary google-login" href="/api/auth/demo?return_to=/">◎ 테스트 참가자로 로그인</a>}</div>
      </section>}

      <nav className="mobile-nav"><button className={tab === "home" ? "active" : ""} onClick={()=>move("home")}><span>🏠</span>홈</button><button className={tab === "place" ? "active" : ""} onClick={()=>move("place")}><span>🗺️</span>발견</button><button className="join-fab" onClick={()=>move("join")}><span>＋</span>Join</button><button className={tab === "messages" ? "active" : ""} onClick={()=>move("messages")}><span>💬</span>메시지</button><button className={tab === "profile" ? "active" : ""} onClick={()=>move("profile")}><span>👤</span>프로필</button></nav>
      {creatingJoin && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreatingJoin(false)}><section className="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-create-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="닫기" onClick={() => setCreatingJoin(false)}>×</button><span className="mini-label">NEW JOIN</span><h2 id="join-create-title">새로운 Join 만들기</h2><p>함께하고 싶은 일정과 모집 내용을 알려주세요.</p><form onSubmit={saveJoin}><label>제목<input required maxLength={40} value={joinDraft.title} onChange={(event) => setJoinDraft({...joinDraft, title:event.target.value})} placeholder="예: 함께 오름 일몰 보러 가요" /></label><label>소개<textarea required maxLength={300} rows={4} value={joinDraft.description} onChange={(event) => setJoinDraft({...joinDraft, description:event.target.value})} placeholder="어떤 시간을 함께 보내고 싶은지 적어주세요" /></label><div className="form-grid"><label>장소<input required maxLength={60} value={joinDraft.location} onChange={(event) => setJoinDraft({...joinDraft, location:event.target.value})} placeholder="만나는 장소" /></label><label>주제<select value={joinDraft.keyword} onChange={(event) => setJoinDraft({...joinDraft, keyword:event.target.value})}><option>여행</option><option>맛집</option><option>산책</option><option>액티비티</option><option>기타</option></select></label><label>날짜<input required type="date" value={joinDraft.date} onChange={(event) => setJoinDraft({...joinDraft, date:event.target.value})} /></label><label>시간<input required type="time" value={joinDraft.time} onChange={(event) => setJoinDraft({...joinDraft, time:event.target.value})} /></label><label>모집 인원<input required type="number" min={2} max={20} value={joinDraft.max} onChange={(event) => setJoinDraft({...joinDraft, max:event.target.value})} /></label></div><button className="primary submit-join" type="submit" disabled={savingJoin}>{savingJoin ? "등록 중…" : "Join 등록하기"}</button></form></section></div>}
      {editingNickname && <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditingNickname(false)}><section className="nickname-modal" role="dialog" aria-modal="true" aria-labelledby="nickname-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="닫기" onClick={() => setEditingNickname(false)}>×</button><span className="mini-label">MY PROFILE</span><h2 id="nickname-title">닉네임 바꾸기</h2><p>Join과 프로필에 표시할 이름을 정해 주세요.</p><form onSubmit={saveNickname}><label htmlFor="nickname">닉네임</label><input id="nickname" autoFocus minLength={2} maxLength={20} value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} placeholder="2~20자로 입력" /><small>{nicknameDraft.trim().length}/20</small><button className="primary" type="submit" disabled={savingNickname || nicknameDraft.trim().length < 2}>{savingNickname ? "저장 중…" : "닉네임 저장"}</button></form></section></div>}
      {activeChat && <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveChat(null)}><section className="join-chat-modal" role="dialog" aria-modal="true" aria-label={`${activeChat.title} 채팅`} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" type="button" aria-label="닫기" onClick={() => setActiveChat(null)}>×</button><span className="mini-label">JOIN CHAT · 참여자 전용</span><h2>{activeChat.title}</h2><p>이 채팅은 Join 호스트와 참여자만 볼 수 있어요.</p><div className="join-message-list">{messages.length ? messages.map((message) => <div key={message.id}><b>{message.displayName}</b><span>{message.body}</span><small>{new Date(message.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small></div>) : <em>아직 대화가 없어요. 먼저 인사를 건네 보세요.</em>}</div><form className="join-message-form" onSubmit={sendMessage}><input value={messageDraft} maxLength={500} onChange={(event) => setMessageDraft(event.target.value)} placeholder="참여자에게 메시지 보내기" /><button type="submit" disabled={sendingMessage || !messageDraft.trim()}>{sendingMessage ? "전송 중" : "보내기"}</button></form></section></div>}
      {showOnboarding && user && <div className="modal-backdrop onboarding-backdrop" role="presentation"><section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><span className="mini-label">HONGSEONG MATE · {onboardingStep}/2</span><h2 id="onboarding-title">{onboardingStep === 1 ? <>어떤 방식으로<br/>홍성을 만나시나요?</> : <>홍성에서의<br/>기본 정보를 알려주세요</>}</h2><p>{onboardingStep === 1 ? "먼저 이용 유형을 선택해 주세요. 홍성프렌즈 기수 인증은 프로그램 확정 후 진행합니다." : "필요한 범위만 공개해 서로 편안하게 연결합니다."}</p><form onSubmit={saveOnboarding}>{onboardingStep === 1 ? <><fieldset><legend>이용 유형</legend><div className="member-type-options"><button type="button" className={onboardingDraft.memberType === "master" ? "selected" : ""} onClick={() => setOnboardingDraft({...onboardingDraft, memberType: "master", profileVisibility: "private"})}><b>🛠 Master</b><small>운영·검수·참가자 관리</small></button><button type="button" className={onboardingDraft.memberType === "friends" ? "selected" : ""} onClick={() => setOnboardingDraft({...onboardingDraft, memberType: "friends", profileVisibility: "private"})}><b>🤝 홍성프렌즈 멤버</b><small>체류 프로그램 참여 예정</small></button><button type="button" className={onboardingDraft.memberType === "general" ? "selected" : ""} onClick={() => setOnboardingDraft({...onboardingDraft, memberType: "general", profileVisibility: "private"})}><b>🧭 일반 참가자</b><small>홍성 정보를 둘러보는 중</small></button></div></fieldset><button className="primary" type="button" disabled={!onboardingDraft.memberType} onClick={() => setOnboardingStep(2)}>다음 단계</button></> : <><button className="onboarding-back" type="button" onClick={() => setOnboardingStep(1)}>← 이용 유형 다시 선택</button>{onboardingDraft.memberType === "master" && <label>Master 인증 코드<input required value={onboardingDraft.masterCode} onChange={(event) => setOnboardingDraft({...onboardingDraft, masterCode: event.target.value.toUpperCase()})} placeholder="운영자 인증 코드" /><small>로컬 데모 코드: MASTER-LOCAL</small></label>}{onboardingDraft.memberType === "friends" && <p className="onboarding-notice">기수 인증은 선정 안내 후 개인 초대 코드로 진행해요. 지금은 멤버 기본 정보를 먼저 설정합니다.</p>}<label>홍성 체류 계획<select value={onboardingDraft.stayPeriod} onChange={(event) => setOnboardingDraft({...onboardingDraft, stayPeriod: event.target.value})}><option>2주 체류</option><option>1개월 체류</option><option>3개월 이상</option><option>아직 정하는 중</option></select></label><label>주로 머무는 곳<input required maxLength={30} value={onboardingDraft.stayArea} onChange={(event) => setOnboardingDraft({...onboardingDraft, stayArea: event.target.value})} placeholder="예: 홍성읍, 홍북읍, 서부면" /><small>읍·면 단위까지만 입력해 주세요.</small></label><fieldset><legend>함께 나누고 싶은 관심사 <small>최대 5개</small></legend><div className="interest-chips">{ONBOARDING_INTERESTS.map((interest) => <button type="button" key={interest} className={onboardingDraft.interests.includes(interest) ? "selected" : ""} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></fieldset><fieldset><legend>프로필 공개 범위</legend><div className="visibility-options"><label><input type="radio" checked={onboardingDraft.profileVisibility === "private"} onChange={() => setOnboardingDraft({...onboardingDraft, profileVisibility: "private"})} /> 비공개</label>{onboardingDraft.memberType === "friends" && <><label><input type="radio" checked={onboardingDraft.profileVisibility === "cohort"} onChange={() => setOnboardingDraft({...onboardingDraft, profileVisibility: "cohort"})} /> 홍성 해당 기수에게</label><label><input type="radio" checked={onboardingDraft.profileVisibility === "friends"} onChange={() => setOnboardingDraft({...onboardingDraft, profileVisibility: "friends"})} /> 홍성프렌즈 모두에게</label></>}<label><input type="radio" checked={onboardingDraft.profileVisibility === "public"} onChange={() => setOnboardingDraft({...onboardingDraft, profileVisibility: "public"})} /> {onboardingDraft.memberType === "friends" ? "일반 참가자에게도 전체 공개" : "전체 공개"}</label></div></fieldset><p className="onboarding-notice">정확한 숙소 주소·개인 연락처는 공개하지 않아요.</p><button className="primary" type="submit" disabled={savingOnboarding || onboardingDraft.interests.length === 0 || !onboardingDraft.stayArea}>{savingOnboarding ? "저장 중…" : onboardingDraft.memberType === "master" ? "Master 인증 완료하기" : "기본 설정 완료하기"}</button></>}</form></section></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
      <footer><div className="shell"><span className="brand-mark">이</span><p><b>홍성, 이어가유</b><small>오늘의 인연이 다음 방문으로.</small></p></div></footer>
    </main>
  );
}

function JoinCard({ item, joined, onJoin, onDelete, onChat }: { item: JoinItem; joined: boolean; onJoin: () => void; onDelete: () => void; onChat: () => void }) {
  const joinLabel = item.isOwner ? "내가 만든 Join" : joined ? "참여 완료 ✓" : item.status === "모집중" ? "함께하기" : item.status;
  return <article className="join-card"><div className="join-visual green"><span>{item.icon}</span><i>{item.status}</i></div><div className="join-body"><div className="tags"><span>#{item.keyword}</span><span>#{item.date.slice(5)}</span></div><h3>{item.title}</h3><p className="join-description">{item.description}</p><p>🕒 {item.date} {item.time}</p><p>📍 {item.location}</p><p>👥 {item.people + (joined ? 1 : 0)}/{item.max}명 · by {item.host}</p><button className={joined ? "joined" : ""} disabled={item.isOwner || item.status !== "모집중"} onClick={onJoin}>{joinLabel}</button>{(item.isOwner || joined) && <button className="join-chat-button" type="button" onClick={onChat}>참여자 채팅 열기</button>}{item.canDelete && <button className="join-delete" type="button" onClick={onDelete}>이 Join 삭제</button>}</div></article>;
}
