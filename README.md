# 홍성메이트 (Hongseong Mate)

「홍성, 이어가유」 구옥 스테이 참가자를 위한 **근거리 정보**와 **Join 커뮤니티**, **AI 안내(RAG)** 서비스입니다.

이 저장소는 [gon311/DLthon_2nd](https://github.com/gon311/DLthon_2nd) (버킷제주, AI엔지니어링 부트캠프 DLthon 팀 프로젝트, 2026.8.11 발표)를 원본으로 하여, 홍성 지역에 맞게 새로 만드는 프로젝트입니다. 원본 프로젝트의 구조(근처 발견 지도, Join 커뮤니티, RAG 기반 AI 질문 응답)를 그대로 가져오고, 브랜딩과 지역 데이터만 홍성으로 교체했습니다.

## 프로젝트 개요

혼자 또는 짧게 홍성에 머무는 참가자를 위해, 구옥 스테이 투숙객끼리 순간을 함께하는 Join 시스템과 근거리 정보(축제 일정, 오일장, 실제 방문객이 남긴 로컬 맛집 리뷰)를 제공합니다.

## 원본과 다른 점 / 앞으로 채워야 할 것

자세한 항목은 [ADAPTATION_TODO.md](./ADAPTATION_TODO.md)를 참고하세요. 요약하면:

- 브랜딩(제주·버킷 → 홍성·홍성메이트)은 화면에 보이는 핵심 문구 위주로 반영했습니다.
- 구옥 스테이 위치는 아직 정해지지 않아 비워뒀습니다 — 지도는 "위치 미정" 상태로 표시되고, 위치가 정해지면 `.env`에 좌표를 채워 넣으면 됩니다.
- 근처 장소 예시는 이번 세션에서 검증된 실제 홍성 장소(남당항, 홍성전통시장, 홍주읍성, 용봉산)로 바꿨지만, 실제 좌표·거리 데이터는 아직 없습니다.
- 축제 일정, 오일장 일정·장소, 로컬 맛집 리뷰 데이터는 아직 없습니다 — 지어낼 수 없는 부분이라 실제 데이터 수집이 필요합니다.

## 설치 및 실행

### 1. 환경 설정

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

### RAG 백엔드

저장소 루트에서 실행합니다.

```bash
pip install -r backend/requirements.txt
python backend/build_index.py --csv data/processed/guesthouse_pois.csv --collection poi_demo --smoke-test
```

실행 전 `OPENAI_API_KEY` 환경변수가 필요합니다. `backend/config.py`의 좌표(`HONGSEONG_MATE_LATITUDE`, `HONGSEONG_MATE_LONGITUDE`)는 구옥 스테이 위치가 아직 없어 비워뒀습니다 — 위치가 정해지면 `.env`에 값을 채워 넣으세요.

## 표준 파일 구조

- `frontend/` — Next.js + TypeScript 웹, Cloudflare D1·Drizzle
- `backend/` — FastAPI · RAG · ChromaDB 검색 코드
- `data/` — POI CSV와 수집·가공 스크립트
- `docs/` — API 계약, 지식베이스 스키마
