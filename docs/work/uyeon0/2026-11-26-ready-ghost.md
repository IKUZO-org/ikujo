# 준비 인원에서 유령 빼기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/fix-53-ready-ghost |
| 이슈 | #53 |
| 문서 번호 | 단계 6, FR-043, FR-050, BR-011, AC-BR-011 |

## 할 일
r2, r3 준비 인원의 분모에 유령이 들어가 모두 준비해도 "N-1/N" 으로 남는 문제를 고친다. 단계 6(#21)에서 만든 분모가 나간 사람만 빼고 있었는데, #49 에서 유령이 생기면서 드러났다.

## 한 일
- `src/server/game-phase.ts` `readyCounts`: 분모를 "이 판에 배정이 있고, 나가지 않았고, 유령이 아닌 사람" 으로 바꿈. 누른 수도 같은 기준으로 셈 (판 중에 나간 사람이나 유령이 이미 누른 것이 남아 "누른 수 > 분모" 가 되지 않게)
- `src/server/rooms/core.ts` `GameState.ready`: `count`, `total` 을 `readyCounts` 와 같은 기준으로 맞춤 (유령은 `store.getGhost`)
- `tests/db/phase.test.ts`: r2 에서 유령 1명(유령이 미리 누른 준비 포함), 나머지 3명이 준비하면 3/3
- r1~r3 은 시간으로만 넘어가므로(OQ-007) 단계 진행은 바뀌지 않고 표시만 바뀜

## 프롬프트 요약
1. 이슈 #53 을 구현. 범위는 이슈 본문, 누른 수도 분모와 같은 기준으로 맞추기로 정함 (같은 화면 숫자가 어긋나지 않게). 다른 작업과 겹치지 않게 준비 인원 코드만 건드림
2. #61 에서 판 참가자를 배정 기준으로 세게 바뀌어서, 그 기준 위에서 유령만 뺌. r1~r3 은 시간으로만 넘어가서(OQ-007) 표시만 고침

## 사용한 skill
- worklog: 이 기록
- demo-record (로컬): 시크릿 창 4개 띄우고 클릭, 스크린샷
- 에이전트 test-pruner: 테스트 목록 (지울 것 없음, `GameState.ready` 는 테스트가 직접 보지 않는다는 지적 → 브라우저 확인으로 봄)
- 에이전트 comment-reviewer: 주석 목록 (고칠 것 없음)

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 10 파일, 122 통과
- `npm run test:db` → 7 파일, 34 통과
- 브라우저 (빌드, 390×844 창 4개, 로컬 Supabase): r2 에서 유령(p4) 화면에는 준비 버튼 없음, 나머지 3명 화면은 "준비 완료 0/3" → 3명 모두 누른 뒤 "준비했어요 3/3"

## 남은 일
- 다른 작업(#63)이 `game-phase.ts` 를 같이 고치므로 먼저 머지된 쪽 다음에 develop 을 합쳐 충돌 확인

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-26). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 100 · 출력 15.9k · 캐시 쓰기 100.9k · 캐시 읽기 4.6M |
| 메시지 | 46 (메인 42, 서브에이전트 4) |
| 모델 | claude-opus-5-5 46 |
| 사용률 | 5시간 18% → 20% · 주간 36% → 36% |
| 많이 쓴 도구 | Bash 37, Read 9, SubagentHandback 2, Agent 2, Skill 1 |
| skill | worklog 1 |
| 에이전트 | test-pruner 1, comment-reviewer 1 |

<!-- usage {"branch":"uyeon0/fix-53-ready-ghost","issue":53,"sessions":1,"messages":46,"first":"2026-11-26","last":"2026-11-26","tokens":{"input":100,"output":15868,"cacheWrite":100892,"cacheRead":4554136},"costUSD":null,"where":{"main":{"messages":42,"output":14067},"subagent":{"messages":4,"output":1801}},"models":{"claude-opus-5-5":{"messages":46,"output":15868}},"tools":{"Bash":37,"SubagentHandback":2,"Read":9,"Skill":1,"Agent":2},"skills":{"worklog":1},"agents":{"test-pruner":1,"comment-reviewer":1},"rate":{"five_hour":{"from":18,"to":20},"seven_day":{"from":36,"to":36}}} -->
