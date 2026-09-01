# 홍성메이트 적용 체크리스트

원본: [gon311/DLthon_2nd](https://github.com/gon311/DLthon_2nd) (버킷제주, AI엔지니어링 부트캠프 DLthon 팀 프로젝트)

이 문서는 "무엇을 이미 바꿨고, 무엇을 더 해야 하는지"를 정리한 것입니다. 원본 팀 프로젝트를 통째로 가져오되, 발표용 산출물(deliverables/)과 과거 버전 코드(services/old/), 실험 기록(data/eval/)은 실제 서비스 개발에는 필요 없다고 판단해 이번 복사에서 제외했습니다. 필요하면 원본 저장소에서 다시 가져올 수 있습니다.

## 이미 반영한 것

- 화면에 보이는 핵심 브랜딩 문구: 제주 → 홍성, 버킷 → 홍성메이트 (`frontend/app/client-home.tsx`, `frontend/app/layout.tsx`)
- 지도 근처 장소 예시를 이번 세션에서 검증된 실제 홍성 장소(남당항·홍성전통시장·홍주읍성·용봉산)로 교체
- 시드 데이터 파일명 변경 (`bucket-jeju-m3-seed.synthetic.json` → `hongseong-mate-m3-seed.synthetic.json`, 내용은 그대로 — 어차피 합성/테스트용 가짜 데이터라고 파일 안에 명시되어 있음)
- **구옥 스테이 위치는 아직 정해지지 않아 비워뒀습니다.** `backend/config.py`의 `HONGSEONG_MATE_LATITUDE/LONGITUDE`는 `.env`에 값이 없으면 `None`이 되도록 바꿨고, 프론트엔드 근처 발견 화면(`frontend/app/client-home.tsx`)도 임의 좌표에 지도를 찍는 대신 "위치 미정" 플레이스홀더를 보여주도록 했습니다. 위치가 정해지면 이 문서의 다음 항목을 진행하세요.

## 아직 안 한 것 — 데이터 (지어낼 수 없어서 실제 조사가 필요합니다)

- [ ] **구옥 스테이 실제 좌표** — 위치가 정해지면 `.env`에 `HONGSEONG_MATE_LATITUDE`, `HONGSEONG_MATE_LONGITUDE`, `LODGING_LAT`, `LODGING_LNG`를 채우고, `frontend/app/client-home.tsx`의 "위치 미정" 플레이스홀더(`map-placeholder`, `location-pending` 클래스)를 다시 실제 지도 iframe으로 되돌리세요
- [ ] **근처 POI 데이터** — `data/processed/guesthouse_pois.csv`는 아직 제주 데이터 그대로입니다. 위치가 정해진 뒤 `data/scripts/collect_pois.py`를 그대로 재사용할 수 있고, `.env`에 `KAKAO_API_KEY`, `LODGING_LAT`, `LODGING_LNG`만 채우면 홍성 기준으로 다시 수집됩니다
- [ ] **오일장 일정·장소** — 화면에서 언급하신 "오일장 열리는 장소와 알림" 기능용 데이터. 실제 개장일·장소 확인 필요 (예: 홍성전통시장은 매달 1·6일 — 이번 세션에서 확인한 것 하나뿐이고, 다른 읍·면 오일장은 아직 확인 안 됨)
- [ ] **축제 일정** — "축제 장소와 일정 알림"용 데이터. 연간 축제 캘린더 확보 필요
- [ ] **로컬 맛집 리뷰** — "실제 방문객이 이용한 식당" 리뷰 시스템용 초기 데이터. 이건 정의상 실제 참가자들이 채워나가야 하는 데이터라 미리 만들어둘 수 없습니다 — Join 커뮤니티처럼 참가자 리뷰 등록 기능으로 붙이는 게 자연스러워 보입니다
- [ ] **게스트하우스 FAQ** — `frontend/seed-data/guesthouse-faq.ts`, `data/processed/guesthouse_faq.json`이 전부 버킷제주 내용입니다. 구옥 스테이 운영 규칙이 정해지면 그 내용으로 교체

## 아직 안 한 것 — 코드/카피 (전부 확인 후 손으로 바꾸는 걸 권장합니다)

- [ ] `frontend/app/globals.css` 등 CSS의 Jeju 테마 요소(귤색 포인트 컬러, 돌하르방·오렌지나무 장식 클래스 `harubang`, `orange-tree` 등) — 이번 작업에서는 JSX에서 해당 장식 요소만 제거했고, CSS 자체는 손대지 않았습니다. 홍성 테마 색상·장식으로 다시 디자인하는 걸 권장합니다
- [ ] `frontend/app/api/`, `backend/api/`, `backend/models.py`, `backend/main.py` 등 API·DB 레이어 — 이번 작업에서는 문자열 브랜딩만 확인했고 로직은 그대로입니다. 실행해보면서 제주 관련 하드코딩이 남아있는지 확인 필요
- [ ] `docs/kb_schema.md`, `docs/api_contract.md` — 스키마/계약 문서 자체는 지역에 무관하게 재사용 가능하지만, 예시 데이터에 제주 내용이 남아있을 수 있음

## 실행 전 확인

```bash
grep -rn "제주\|버킷\|jeju\|bucket" --include="*.ts" --include="*.tsx" --include="*.py" .
```

위 명령으로 아직 안 바뀐 부분을 다시 훑어볼 수 있습니다.
