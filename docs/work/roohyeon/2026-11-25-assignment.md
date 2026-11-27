# 배정 (CAG)

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-25 |
| 사람 | @roohyeon |
| 브랜치 | roohyeon/feat-25-assignment |
| 이슈 | #25 |
| 문서 번호 | 단계 5, spec §5, FR-020, BR-002~006, BR-014, AC-020-1~4, NFR-003, D-011, D-020, OQ-003, OQ-013 |

## 할 일
spec §5 배정: 규칙 배정, AI 배정(모델 인터페이스 + 가짜 모델), 서버 규칙 검사, startGame 의 AI → 다시 → 규칙 흐름.

## 한 일
- `src/server/assign.ts`
  - `assignByRule(scenario, players, random)`: 단계 4 스텁을 바꿈. 인원별 등장인물(BR-002), 범인은 핵심 중 OQ-013으로 막힌 범인 빼고(BR-003, BR-006), 희생자는 범인 아닌 핵심(BR-004), 자리 무작위, 개인 단서 배분
  - 개인 단서 배분 (임시, 아래 남은 일): 이번 범인을 가리키는 개인 단서 + 이 판에 있는 인물을 가리키는 레드 헤링. 단서 하나에 받는 사람 1명(for 중 이 판에 있는 인물, r2부터 희생자 제외, 덜 받은 사람부터)
  - `validateAssignment(scenario, players, plan)`: 형식(zod), 자리와 인물 구성(BR-002), 범인(BR-003, BR-006), 희생자(BR-004), 없는 인물/단서 ID(AC-020-4), 단서는 그 라운드 개인 단서이고 받을 수 있는 사람에게 한 번만
  - `toAssignment`: 검사 통과한 Plan → `assignments`(clue_ids 포함), `game_secrets`
- `src/server/assign-ai.ts`
  - `AssignModel` 인터페이스, `assignByAI`: 고정 맥락 = 시나리오 JSON 전체(프롬프트 캐시 대상), 가변 입력 = 인원, 자리, 등장인물 ID, 범인 후보. 닉네임 같은 사용자 글은 넣지 않음. 출력 = spec §5-3 모양 JSON
  - `chooseAssignment`: AI 1번 → 검사 실패면 1번 더 → 2번 실패, 호출 오류, 15초 초과면 규칙 배정 (NFR-003). AI 응답 원문과 실패 원인을 `game_secrets.llm_raw` 에
- `src/server/llm.ts`: `LLM_MODEL` 환경 변수 자리. OQ-003 미정이라 실제 SDK는 안 붙임 → 늘 규칙 배정
- `src/server/rooms/core.ts` `startGame`: `chooseAssignment` 사용, `assignment_source` 에 ai/rule 기록, intro 타이머는 배정이 끝난 뒤부터
- `src/server/rooms/store.ts`, `supabase-store.ts`: `clue_ids`, `llm_raw` 저장
- `.env.example`: `LLM_MODEL=` 이름만 추가
- 테스트: `tests/assign.test.ts` 20개, `tests/rooms.test.ts` 1개 추가(AI 배정 → source=ai, 응답과 신호에 범인 없음)

## 프롬프트 요약
1. 버그 PR(#26)을 올려 달라
2. 5단계를 시작해 달라 (공통 규칙 + 5단계 개발 프롬프트: assignByRule, assignByAI(LLM_MODEL), validateAssignment, startGame 재시도와 15초, 범인 정보 숨기기, 인원별 100판 테스트와 가짜 모델 테스트)

## 사용한 skill
- 없음 (`worklog` skill 양식대로 씀)
- 서브에이전트, MCP: 없음

## 확인
- `npm test` → 5개 파일, 78개 통과 (이번 추가 21개). 인원별(4, 5, 6) 100판 규칙 배정 모두 검사 통과
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm run build` → 통과
- 브라우저 번들(`.next/static`)에 시나리오 비밀 문장, AI 프롬프트(`ASSIGN_SYSTEM`), `culpritCandidates`, `SUPABASE_SERVICE_ROLE_KEY` → 0건
- `npm run test:db`, 화면으로 게임 시작 → 안 돌림 (로컬 Supabase 없음)

## 남은 일
- spec §5-4 "개인 단서는 그 라운드에 정해진 수만큼"의 "정해진 수"가 문서에 없음. 이 PR은 "맞는 단서 전부, 단서 하나에 1명"으로 임시. 시나리오 담당과 정할 것 (Hatch 문서)
- "다른 범인일 때의 증거(레드 헤링 아님)는 주지 않는다"는 공정(PRD G-4)을 위해 넣은 `제안`. 문서에 없는 규칙이라 확인 필요
- 공용 단서: R3 반전 단서(`c-r3-*`)는 공용인데 범인마다 다름(pointsTo). 라운드 진입 때 공용 단서를 넣는 단계 6에서 이번 범인 것만 열어야 함 (정연에게 전달)
- 시나리오의 `TODO(시나리오 담당)` 단서도 지금 배분됨 (ID는 맞음). 문장이 채워지기 전까지 화면에 TODO 글이 보일 수 있음
- OQ-003: 모델이 정해지면 `src/server/llm.ts` 에 SDK 연결, 키 이름을 `.env.example` 에 추가 (별도 이슈)
- S-06 "15초 넘으면 '조금만 더 기다려 주세요'" 화면 문구는 단계 7 화면에서
- data §4 `제안` "이번 범인을 가리키는 단서가 라운드마다 1개 이상" 은 검사에 넣지 않음 (지금 시나리오로는 R3가 공용뿐이라 개인 단서로는 못 채움)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-25). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 0개) |
| 토큰 | 입력 0 · 출력 0 · 캐시 쓰기 0 · 캐시 읽기 0 |
| 메시지 | 0 (메인 0, 서브에이전트 0) |
| 모델 | 없음 |
| 사용률 | 기록 없음 (상태줄 사용률이 켜진 뒤부터 남는다) |
| 많이 쓴 도구 | 없음 |
| skill | 없음 |
| 에이전트 | 없음 |

<!-- usage {"branch":"roohyeon/feat-25-assignment","issue":25,"sessions":0,"messages":0,"first":null,"last":null,"tokens":{"input":0,"output":0,"cacheWrite":0,"cacheRead":0},"costUSD":null,"where":{"main":{"messages":0,"output":0},"subagent":{"messages":0,"output":0}},"models":{},"tools":{},"skills":{},"agents":{},"rate":null} -->
