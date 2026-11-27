# 원격 DB 표 권한 맞추기 (011)

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-27 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/fix-113-table-grants |
| 이슈 | #113 |
| 문서 번호 | data §3, NFR-004 |

## 할 일
원격 DB 에서 서버(service role)가 표를 읽고 쓰지 못하는 문제(`permission denied for table rooms`)를 마이그레이션 011 로 고친다.

## 한 일
- `supabase/migrations/011_table_grants.sql`: service_role 에 모든 public 표 select/insert/update/delete, 시퀀스 usage/select. anon, authenticated 에는 주지 않음 (브라우저는 표를 직접 읽지 않고 실시간 채널만 써서 최소 권한). 앞으로 만들 표도 service_role 이 쓰도록 기본 권한. players 칸별 권한과 002 의 쓰기 기본 권한 회수는 그대로
- `tests/db/grants.test.ts`: service_role 이 모든 public 표에 네 권한을 가지는지 information_schema 로 확인
- `tests/db/local-supabase.ts`: `dbContainer`, `psql` 도우미를 `cleanup.test.ts` 에서 옮겨 함께 씀

## 프롬프트 요약
1. 이슈 #113: 011 마이그레이션으로 원격 표 권한을 로컬(Supabase 기본값)과 같게 맞추고, 로컬에서 권한이 바뀌지 않는지 비교, service_role 권한 테스트 하나 추가. 001~010 은 고치지 않고 `supabase db reset` 은 하지 않음
2. anon, authenticated 에는 표 SELECT 를 주지 않고 service_role 에만 주도록 011 을 고침

## 사용한 skill
- worklog: 이 작업 기록

## 확인
- 로컬 DB 권한(표별 anon/authenticated/service_role, players 칸별 권한)을 011 적용 전후로 기록해 비교 → 같음 (새로 생긴 권한 없음)
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 13개 파일, 143개 통과
- `npm run test:db` → 9개 파일, 49개 통과
- 원격 적용은 안 함 (머지 뒤)

## 남은 일
- 머지 뒤 원격에 011 적용하고 rooms 등 모든 표의 service_role 권한 확인, 배포판에서 방 만들기, 입장, 게임 시작 확인

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-27). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 34 · 출력 8.2k · 캐시 쓰기 30.9k · 캐시 읽기 1.4M |
| 메시지 | 15 (메인 15, 서브에이전트 0) |
| 모델 | claude-opus-5-5 15 |
| 사용률 | 5시간 19% → 20% · 주간 5% → 5% |
| 많이 쓴 도구 | Bash 12, Skill 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"uyeon0/fix-113-table-grants","issue":113,"sessions":1,"messages":15,"first":"2026-11-27","last":"2026-11-27","tokens":{"input":34,"output":8190,"cacheWrite":30863,"cacheRead":1413686},"costUSD":null,"where":{"main":{"messages":15,"output":8190},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":15,"output":8190}},"tools":{"Bash":12,"Skill":1},"skills":{"worklog":1},"agents":{},"rate":{"five_hour":{"from":19,"to":20},"seven_day":{"from":5,"to":5}}} -->
