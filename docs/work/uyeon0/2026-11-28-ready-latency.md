# 준비 뒤 단계 전환 지연 줄이기

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-28 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/fix-135-ready-latency |
| 이슈 | #135 |
| 문서 번호 | NFR-001, S-07, S-08, spec §4 ready·getRoomState·실시간 신호 |

## 할 일
마지막 준비 뒤 다음 단계 화면이 늦게 뜨는 원인(서버 중복 읽기, count 신호마다 다시 읽기, 겹친 다시 읽기)을 줄인다.

## 한 일
- `src/server/game-phase.ts`
  - `markReady`: 마지막 사람이 눌러 단계가 넘어가면 count 신호를 보내지 않는다 (phase 신호로 충분). 넘기지 못하면(r1~r3 시간 전 등) 지금처럼 count 를 보낸다
  - `advancePhase` 에 선택 인자 `loaded`(판, 준비 수)를 더해 `markReady` 가 이미 읽은 것을 다시 읽지 않는다. 타이머 advance 등 다른 호출은 그대로
  - `loadGameForMember`: 판, 내 참가자 줄(나가지 않은 것), 이 판 배정을 병렬로 읽는다. 판의 방에 있는 줄이고 이 판에 배정이 있어야 하는 확인은 같다
- `src/server/game-vote.ts`: 마지막 표로 판정해 넘어가면 count 신호를 보내지 않는다 (준비와 같은 규칙)
- `src/lib/use-room-state.ts`: count 신호는 다시 읽지 않고 `ready.count` 나 `vote.count` 만 바꾼다. 다른 신호는 그대로 다시 읽는다
- `src/lib/coalesce.ts` + `useRoomState`: 읽는 중에 또 부르면 끝난 뒤 한 번만 더 읽는다. `reload()` 의 promise 는 뒤에 붙은 읽기까지 끝난 뒤 풀린다 (화면의 `await reload()` 는 그대로)
- 액션 뒤 다시 읽기 합류: 화면이 액션을 시작한 시각(`since`)을 `reload(since)` 로 넘긴다. 서버 액션은 하나씩 처리되므로 액션 뒤에 출발한 읽기는 이미 결과를 본다: 그 읽기에 합류만 한다. 액션 전에 출발한 읽기면 끝난 뒤 한 번 더 읽는다. 신호, 화면 열기, 타이머 0 은 그대로 끝난 뒤 한 번 더
  - 화면 호출부: opening, character-card, round, vote, ghost(속삭임, 출몰), reveal, room-view Lobby 시작. 액션 앞에 `const since = performance.now()` 한 줄, `reload(since)`, prop 타입
- `useMine`: 방 상태 객체 대신 `useRoomState` 의 `version`(다시 읽어 받을 때만 늘어남)에 맞춰 다시 읽는다. count 신호로 수만 바뀔 때는 다시 읽지 않는다. 새 단서(단계 신호), 유령 여부, 내 속삭임/출몰 뒤(액션 뒤 다시 읽기)는 그대로 다시 읽고, 받은 속삭임은 주기 읽기로 받는다
- `src/lib/apply-count.ts`: count 신호는 지금 값보다 클 때만 반영한다 (거의 동시에 누르면 4 → 3 처럼 거꾸로 올 수 있음). 다시 읽기로 받은 값은 그대로 덮어쓴다
- count 신호에 gameId, phase 를 싣고 (`markReady`, `castVote`, `RoomSignal`), `applyCount` 는 다른 판/단계 신호를 버린다
- 다시 읽기 응답이 출발 뒤 받은 count 보다 옛 수면 내리지 않는다 (`keepHeardCounts`, 같은 판/단계만)
- 테스트: `tests/apply-count.test.ts`(큰 값만 반영, 다른 판/단계 무시, 읽는 사이 받은 수 지키기), `tests/coalesce.test.ts`(합치기, 합류), `tests/db/phase.test.ts`(마지막 사람 count 생략, 못 넘기면 count 보냄), `tests/db/vote.test.ts`(마지막 표로 넘어가면 count 생략)

## 프롬프트 요약
1. QA 3번(시작 뒤 시작까지 시간, PC와 폰 어긋남)과 5번(오프닝 끝 "다음" 뒤 표시가 늦음)을 코드로 확인
2. 프로덕션(ikujo.vercel.app)에서 창 4개(시크릿, 390×844)로 시작과 준비 지연을 재기
3. 해결 방안을 ponytail-review 에이전트에게 검토받고, 이슈를 하나로 할지 둘로 나눌지 판단받기
4. 서버와 공용 훅 범위로 이슈를 만들고, 화면 쪽 즉시 표시는 다시 잰 뒤로 미루기. "기다리는 중" 문구는 문서(hatch)에 없어 기준에서 빼기
5. 끝났다고 보는 기준을 머지 전(로컬 요청 횟수)과 머지 뒤(프로덕션 다시 재기)로 나누기
6. 이슈 #135 범위로 markReady 중복 줄이기, count 신호는 다시 읽지 않기, useRoomState 읽기 합치기. 화면 버튼 동작과 액션 뒤 reload 는 그대로, 새 패키지 없이, 커밋은 나누고 push/PR 은 하지 않음 (액션 뒤 reload 는 10번에서 바꿈)
7. test-pruner, comment-reviewer 를 돌리고, 지울 주석 2개와 castVote 테스트 추가
8. 작업 기록의 test:db 결과를 다시 돌린 결과로 고치기
9. 로컬 창 4개로 요청 횟수 확인
10. 액션 뒤 reload 합류, useMine 다시 읽기 줄이기
11. develop(#137) 합치기, reveal.tsx 충돌 해결
12. count 신호 역순 도착 막기 (#139 리뷰에서 나옴)
13. count 신호에 판/단계 싣기, 다시 읽기 응답과 겹칠 때 count 지키기 (ponytail 리뷰)

## 사용한 skill
- worklog: 이 기록
- ponytail-review: 해결 방안 검토, 이슈 나누기 판단
- test-pruner, comment-reviewer: 지울 테스트 없음, 지울 주석 2개
- hatch `read_doc`: PRD, 기능명세 원본 확인 (NFR-001, S-07, S-08, §4)
- Chrome CDP(새 패키지 없이 레포 밖 스크립트): 프로덕션 창 4개 시간 측정

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 160 통과
- `npm run test:db` → 51 통과 (한 번은 vote.test.ts D-022 1개 실패, develop 에서도 같은 실패. 다시 돌리니 통과)
- 로컬 창 4개 요청 횟수 (액션 뒤 합류 뒤 다시 잼) → 기준 4개 모두 통과: 방장 시작 뒤 getRoomState 1번, 중간 사람이 누를 때 다른 창 0번, 마지막 뒤 다른 창 1번, 누른 사람 ready 뒤 1번. getMine 은 count 신호마다 부르지 않음

## 남은 일
- 머지 뒤 프로덕션에서 다시 재기
- vote.test.ts D-022 가 가끔 실패함 (develop 에서도)
- 투표에서 못 넘긴 경우 count 를 보내는 테스트는 넣지 않음: 마지막 표는 판정으로 늘 넘어가고, 못 넘기는 경우는 동시 호출(stale)뿐이라 순서가 정해지지 않음

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-28). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 182 · 출력 48.4k · 캐시 쓰기 124.5k · 캐시 읽기 12.2M |
| 메시지 | 82 (메인 82, 서브에이전트 0) |
| 모델 | claude-opus-5-5 82 |
| 사용률 | 5시간 12% → 3% · 주간 17% → 18% |
| 많이 쓴 도구 | Bash 76, Skill 1 |
| skill | worklog 1 |
| 에이전트 | 없음 |

<!-- usage {"branch":"uyeon0/fix-135-ready-latency","issue":135,"sessions":1,"messages":82,"first":"2026-11-28","last":"2026-11-28","tokens":{"input":182,"output":48423,"cacheWrite":124455,"cacheRead":12198098},"costUSD":null,"where":{"main":{"messages":82,"output":48423},"subagent":{"messages":0,"output":0}},"models":{"claude-opus-5-5":{"messages":82,"output":48423}},"tools":{"Bash":76,"Skill":1},"skills":{"worklog":1},"agents":{},"rate":{"five_hour":{"from":12,"to":3},"seven_day":{"from":17,"to":18}}} -->
