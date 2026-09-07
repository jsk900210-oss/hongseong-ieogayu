# 홍성, 이어가유

홍성의 유휴공간 스테이를 거점으로 청년이 지역에서 잠시 지내보고, 장소·이웃·농산물·모임과 연결되도록 돕는 모바일 우선 웹앱입니다.

- 라이브 데모: https://hongseongmate.ep01-sleepwar.chatgpt.site/
- 서비스명: 홍성, 이어가유 (Hongseong Mate / Local Stay Community)
- 화면 원칙: PC에서도 약 600px 폭의 모바일 앱 경험으로 표시

## 현재 구현 범위

- **홈** — 유휴공간 스테이 소개, `홍성에서 지내보기` 핵심 행동, 오늘의 바로가기
- **발견** — 홍성의 장소·행사·주차장과 카카오맵 기반 주변 편의시설 탐색
- **마켓** — 다음 날 입고될 농산물·나눔물품을 미리 보는 스테이 미니마켓
- **Join** — 지역에서 함께할 모임을 만들고 참여하는 커뮤니티
- **레시피** — 홍성 재료 캐릭터와 출처가 있는 레시피 콘텐츠
- **프로필** — 로그인 사용자 활동과 기본 설정
- **Google 로그인** — 로그인 후 이용 유형과 관심사 설정
- **이음이 안내** — 화면 상단의 펫형 안내 친구가 숙소·앱 기능·생활 안전 정보를 답하고 공식 출처를 연결
- **문장형 질문** — 홍성의료원 운영시간·주말 진료·주소·전화·진료과 질문을 날짜와 대화 맥락에 맞춰 안내

현재 하단 메뉴는 `홈 · 발견 · 마켓 · Join · 프로필`입니다. 메시지는 참여한 Join의 채팅에서 이용합니다.

## 스테이·생활 안전 정보 기준

- 구옥 스테이는 활용이 줄어든 홍성의 공간을 청년과 여행자가 짧게 머물며 지역의 일상을 경험하는 공유 스테이로 연결합니다.
- 정확한 숙소 위치·요금·객실·편의시설·예약 일정은 아직 확정되지 않았으며, 이음이는 미확정 정보를 임의로 안내하지 않습니다.
- 병원·약국은 홍성의료원 공식 정보와 건강보험심사평가원·응급의료포털 E-Gen 조회를 연결합니다.
- 경찰·소방은 홍성 관할 공식 기관만 안내하며, 긴급 상황에는 112·119 연락을 우선 안내합니다.
- 숙소 주소가 확정되기 전에는 기관을 가까운 순서로 임의 배치하지 않습니다.
- 저장소와 현재 작업 기록에는 공공데이터포털 활용신청 번호·승인 내역·서비스 키가 없어, API 연동은 아직 확인되지 않은 상태입니다.

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
KAKAO_REST_API_KEY=
```

`KAKAO_REST_API_KEY`는 카카오디벨로퍼스 앱의 REST API 키입니다. 주변 편의시설 화면은 홍성읍·내포·광천·남당항 또는 홍성군 안의 현재 위치를 중심으로 반경 3km의 등록 장소를 검색합니다. 키는 코드나 GitHub에 커밋하지 말고 로컬 `.env.local`과 배포 환경의 비밀 변수에만 등록합니다.

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

## 다른 PC에서 같은 Codex 작업 이어가기

코드는 GitHub으로 동기화되고, **대화 내용까지 그대로 옮기려면 Codex의 채팅 인계 기능**을 사용합니다. 단순 공유 링크는 읽기 전용 사본이므로 작업을 이어 쓸 수 없습니다.

### 다른 PC 준비

1. ChatGPT 데스크톱 앱을 최신 버전으로 설치하고, 현재 PC와 같은 OpenAI 계정·워크스페이스로 로그인합니다.
2. 이 저장소를 내려받아 Codex 프로젝트로 엽니다.

   ```bash
   git clone https://github.com/jsk900210-oss/hongseong-ieogayu.git
   ```

3. 앱 설정에서 **원격(Remote) / 다른 기기 연결 허용**을 켭니다.
4. Codex 앱과 프로젝트를 열어둔 채 온라인 상태로 둡니다.

### 현재 PC에서 채팅 인계

1. 옮길 Codex 채팅 하단의 현재 실행 위치(`Local` 등)를 선택합니다.
2. **호스트 변경** 또는 **채팅 인계**를 선택합니다.
3. 목록의 다른 PC를 선택하고 저장소·브랜치를 확인합니다.
4. **인계**를 누르면 대화와 Git 작업 상태가 대상 PC로 이동합니다.

두 PC에서 같은 Git 저장소와 같은 프로젝트 경로 구조가 등록되어야 대상 PC가 목록에 나타납니다. 원격 연결 기능은 계정·앱 버전에 따라 표시 여부가 다를 수 있습니다.

공식 안내: https://learn.chatgpt.com/ko-KR/docs/remote-connections
