# 축제 일정 검수 에이전트

매일 00:15·06:15·12:15·18:15 UTC(한국 시간 09:15·15:15·21:15·03:15)에 등록 출처를 확인합니다.

1. 공지에서 날짜·취소 여부를 읽어 `/api/festival-agent/sync`로 전송합니다.
2. 새 일정이나 변경된 일정은 `pending`으로 저장됩니다.
3. 서로 다른 출처 두 곳에서 같은 날짜가 확인되면 `verified`로 공개합니다.
4. 취소 공지는 즉시 `cancelled` 상태로 갱신합니다.
5. 모든 확인에는 출처, 문의처, 마지막 확인 시각을 남깁니다.

배포 환경에는 다음 비밀값을 설정해야 합니다.

- `FESTIVAL_AGENT_TOKEN`: API와 GitHub Actions가 공유하는 긴 임의 문자열
- `FESTIVAL_AGENT_URL`: 배포된 앱 주소(예: `https://example.com`)

Cloudflare D1에는 `frontend/drizzle/0003_festival_schedule_agent.sql` 마이그레이션을 먼저 적용합니다. 출처 추가·교체는 `data/hongseong/festival-sources.json`에서 관리합니다.
