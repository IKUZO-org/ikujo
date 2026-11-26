# 투표 뒤 나갔다 판정 전에 돌아온 사람은 표를 바꿀 수 있게

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/feat-63-vote-change |
| 이슈 | #63 |
| 문서 번호 | 단계 9, PRD FR-060, BR-011, D-021, D-022, AC-BR-011-3, 기능명세 S-11, §4 vote, data §2 votes |

## 할 일
D-022 에 맞춰, 투표한 뒤 나갔다가 판정 전에 돌아온 사람만 표를 바꿀 수 있게 한다. 그 밖에는 지금처럼 한 번만 (S-11).

## 한 일
- `supabase/migrations/007_rejoined_at.sql`: `players.rejoined_at` 추가. `left_at` 을 지우는 곳이 `join_room` 하나뿐이라 트리거 없이 `join_room` 을 다시 정의해 `left_at = null, rejoined_at = now()` 를 한 줄에 쓴다. `diff 004 007` 결과는 머리 주석, `create or replace`, rejoined 주석, update 한 줄뿐
- `src/server/game-vote.ts` `castVote`: insert 가 23505 면 `at < rejoined_at` 조건을 update 의 where 에 넣어 바꾼다. 바뀐 줄이 0 이면 "이미 투표했어요". 바꿀 때 `at` 은 max(지금, rejoined_at + 1ms) (Node 시각과 DB 시각 차이로 계속 바꿀 수 있게 되는 것을 막음). 판정 뒤에는 phase 가 넘어가 먼저 거절되고, round 별 표라 재투표도 같은 규칙
- `src/server/rooms/core.ts`, `store.ts`, `supabase-store.ts`: 내 `VoteState` 에만 `myChangeableTarget` (바꿀 수 있으면 내가 고른 사람). 공용 신호(`count`)는 완료 인원만 그대로 (BR-001, AC-060)
- `vote.tsx`: 바꿀 수 있는 사람은 고른 칸이 보이고 "투표 바꾸기", "바꾸지 않으면 고른 표가 그대로 들어가요"
- 주석의 "`제안` (#46), PO 확인 중" 류를 D-021, D-022 로 바꿈 (006 은 이미 원격에 적용돼서 주석도 고치지 않음)
- `tests/db/vote.test.ts`: 돌아와서 바꾸기 → 판정에 바뀐 표, 바꾼 직후 또 바꾸면 거절, 재투표도 같음, 판정 뒤 돌아온 사람은 못 바꿈. 돌아오기는 실제 경로인 `join_room` rpc 로

## 프롬프트 요약
1. 이슈 #63 구현. "투표한 뒤 나갔다 돌아왔는지"를 서버가 아는 방법은 먼저 정하고 만들기, 개별 표가 공용 응답에 새지 않게
2. 방법 결정: 트리거 대신 `join_room` 을 007 에서 다시 정의(004 와 한 줄만 다르게), 바꾸기 조건은 update 의 where 에, 시계 차이를 막으려 at 을 rejoined_at 뒤로, 바꾼 직후 재변경 거절 테스트 추가
3. 적용된 006 마이그레이션은 주석도 고치지 않고 되돌림 (원격 DB 와 레포 파일이 달라지지 않게)

## 사용한 skill
- hatch MCP `read_doc`: 문서 판 번호 확인 (PRD 7판, 기능명세 5판, 데이터 4판. 투표 규칙 D-021, D-022 는 바뀌지 않음)
- demo-record: 시크릿 창 4개로 화면 확인, 스크린샷
- worklog: 이 기록
- 에이전트 test-pruner, comment-reviewer: 지울 테스트, 주석 목록
- 에이전트 ponytail-review: 트리거와 join_room 다시 정의 비교 (left_at 을 지우는 곳이 join_room 하나뿐이라 트리거 불필요, 시계 차이 문제 발견)

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 122개 통과
- `npm run test:db` → 36개 통과 (develop 합친 뒤, 기존 join_room 테스트 포함)
- 브라우저 (빌드, 390×844 창 4개): A가 B에게 투표 → "투표 완료" → 나감 → 방 코드로 다시 들어옴 → B 칸이 고른 채로 보이고 "투표 바꾸기" → C로 바꿈 → "투표 완료", DB 표도 C. 완료 인원은 1/4 그대로
  - 나가기는 DB 의 `left_at` 으로 흉내 냈다 (게임 중 나가기 화면 동작은 안 봄). 다른 창 완료 인원이 나간 사이 줄어드는 것은 신호가 없어 안 봄
  - 판정, 재투표 화면은 브라우저로 안 봄 (test:db 로만)

## 남은 일
- 원격 Supabase 에 007 적용 (머지 뒤)
- 게임 중 나가기 화면 동작이 없어 브라우저에서는 `left_at` 을 DB 로 흉내 냄. 게임 중 "나감"의 기준은 PO 확인 중 (단계 10)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-26). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 144 · 출력 31.0k · 캐시 쓰기 147.5k · 캐시 읽기 8.2M |
| 메시지 | 68 (메인 62, 서브에이전트 6) |
| 모델 | claude-opus-5-5 68 |
| 사용률 | 5시간 18% → 25% · 주간 36% → 37% |
| 많이 쓴 도구 | Bash 47, Read 11, SubagentHandback 2, Skill 2, Agent 2, ToolSearch 1, mcp__hatch__read_doc 1 |
| skill | demo-record 1, worklog 1 |
| 에이전트 | test-pruner 1, comment-reviewer 1 |

<!-- usage {"branch":"uyeon0/feat-63-vote-change","issue":63,"sessions":1,"messages":68,"first":"2026-11-26","last":"2026-11-26","tokens":{"input":144,"output":30996,"cacheWrite":147508,"cacheRead":8191733},"costUSD":null,"where":{"main":{"messages":62,"output":28281},"subagent":{"messages":6,"output":2715}},"models":{"claude-opus-5-5":{"messages":68,"output":30996}},"tools":{"Bash":47,"SubagentHandback":2,"ToolSearch":1,"mcp__hatch__read_doc":1,"Skill":2,"Read":11,"Agent":2},"skills":{"demo-record":1,"worklog":1},"agents":{"test-pruner":1,"comment-reviewer":1},"rate":{"five_hour":{"from":18,"to":25},"seven_day":{"from":36,"to":37}}} -->
