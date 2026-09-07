# 홍성, 이어가유

홍성의 유휴공간 스테이를 거점으로 청년이 지역에서 잠시 지내보고, 장소·이웃·농산물·모임과 연결되도록 돕는 모바일 우선 웹앱입니다.

- 라이브 데모: https://hongseongmate.ep01-sleepwar.chatgpt.site/
- 서비스명: 홍성, 이어가유 (Hongseong Mate / Local Stay Community)
- 화면 원칙: PC에서도 약 600px 폭의 모바일 앱 경험으로 표시

## 현재 구현 범위

- **홈** — 유휴공간 스테이 소개, `홍성에서 지내보기` 핵심 행동, 오늘의 바로가기
- **발견** — 홍성의 장소·행사·주차장 등 지역 정보 탐색
- **마켓** — 다음 날 입고될 농산물·나눔물품을 미리 보는 스테이 미니마켓
- **Join** — 지역에서 함께할 모임을 만들고 참여하는 커뮤니티
- **레시피** — 홍성 재료 캐릭터와 출처가 있는 레시피 콘텐츠
- **프로필** — 로그인 사용자 활동과 기본 설정
- **Google 로그인** — 로그인 후 이용 유형과 관심사 설정

현재 하단 메뉴는 `홈 · 발견 · 마켓 · Join · 프로필`입니다. 메시지는 참여한 Join의 채팅에서 이용합니다.

## PC에서 이어서 실행하기

### 1. 소스 받기

```bash
git clone https://github.com/jsk900210-oss/hongseong-ieogayu.git
cd hongseong-ieogayu/frontend
npm install
```

이미 저장소를 받은 PC라면 아래만 실행합니다.

```bash
git pull origin main
cd frontend
npm install
```

### 2. 로컬 환경 변수 설정

`frontend/.env.example`을 복사해 `frontend/.env.local`을 만들고 값을 채웁니다.

```bash
copy .env.example .env.local
```

필수 항목:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
```

Google OAuth 승인 리디렉션 URI에는 로컬 주소를 등록합니다.

```text
http://localhost:3000/api/auth/google/callback
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### 4. 배포 전 확인

```bash
npm run build
```

## 프로젝트 구조

```text
frontend/
  app/
    client-home.tsx       # 홈·발견·마켓·Join·레시피·프로필 화면
    local-discovery.tsx   # 홍성 둘러보기
    api/                  # 로그인, Join, 프로필 API
  db/                     # Cloudflare D1 + Drizzle 스키마
  drizzle/                # DB 마이그레이션
  public/brand/           # 로고와 이음이 프렌즈 캐릭터
  .openai/hosting.json    # 데모 배포 설정
backend/                  # 향후 RAG/데이터 처리 참고 코드
data/                     # 지역 데이터와 가공 자료
docs/                     # 서비스·API 참고 문서
```

## 기술 구성

- React / Vinext / TypeScript
- Cloudflare Workers + D1
- Drizzle ORM
- Google OAuth
- Leaflet 기반 지역 발견 지도

## 작업할 때 유의할 점

- 실제 조리법과 출처가 확인된 레시피만 게시합니다.
- 농가 단기 일자리 매칭은 안전·보험·알선 관련 검토 전까지 ‘준비 중’ 범위로만 다룹니다.
- Google OAuth 비밀값과 `AUTH_SECRET`은 GitHub에 올리지 않습니다.
- `hongseong-mate-site-*.tar.gz`, 임시 미리보기 이미지, `.npm-cache`는 배포용/로컬 산출물이므로 커밋하지 않습니다.

## 배포

현재 라이브 데모는 Codex Sites 배포를 사용합니다. GitHub에 `main` 브랜치로 소스를 올린 뒤, `frontend`에서 빌드가 성공한 상태로 새 버전을 배포합니다.
