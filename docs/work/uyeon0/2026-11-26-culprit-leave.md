# 범인 이탈과 게임 중 나간 상태 처리

| 항목 | 내용 |
| --- | --- |
| 날짜 | 2026-11-26 |
| 사람 | @uyeon0 |
| 브랜치 | uyeon0/feat-72-culprit-leave |
| 이슈 | #72 |
| 문서 번호 | 단계 10, PRD BR-011, BR-012, D-021~D-023, D-025, 기능명세 §1.1, §4 leaveRoom, §6, §7, S-12, 데이터 §2 games.ended_reason |

## 할 일
게임 중 범인이 나가면 추리 전이면 판을 취소하고 대기실로, 추리 중이면 바로 해설(방송 중단)로 보낸다. `ended_reason` 에 `cancelled`, `stale` 을 더한다.

## 한 일
- `008_ended_reason.sql`: `games.ended_reason` check 에 `cancelled`, `stale` 추가 (001~007 은 고치지 않음)
- `leaveRoom` (core.ts): 게임 중 나간 사람이 범인이면 intro, secret 은 판 취소(ended, cancelled) + 방 lobby, r1~revote 는 reveal(aired_off, culprit_left). 조건부 update 로 advance 와 겹쳐도 한 번만. reveal 이후(해설의 홈으로)는 아무것도 하지 않음. 다시 들어와도 되돌리지 않음
- `player_left` 기록에 나간 순간의 단계(phase) 추가
- 판 취소로 돌아온 대기실: 나간 사람은 `getRoomState` 목록과 `startGame` 인원, 배정에서 뺌. 다시 들어오면 join_room(007)이 이미 left_at 을 지우고 rejoined 를 돌려줘 대기실에 합류하므로 join_room 은 고치지 않음 (#72 `제안`)
- store: `getCulpritPlayerId`, `updateGamePhase` 에 끝낸 이유(outcome, ended_reason, ended 면 ended_at) 인자
- 해설: `ending.culpritLeft` 를 두고, 카드 1 에 "범인 ○○이 자리를 떠나 방송이 중단됐어요", 카드 3, 9 를 뺌. 투표 중 낸 표가 있어도 판정 전이라 뺌 (#72 `제안`). 해설은 첫 getReveal 이 만든다
- 테스트: 단위(취소/해설/되돌리지 않음/해설에서 홈으로), DB(cancelled, stale 저장, 투표 중 이탈 해설에 카드 3, 9 재료 없음)

## 프롬프트 요약
1. 이슈 #72 대로 범인 이탈(D-025)과 008 을 만든다. 나간 상태가 되는 입구(게임 중 나가기 화면, 연결 끊김 감지)는 PO 확인 중이라 만들지 않고, `leaveRoom` 이 나간 뒤 처리를 맡게 둔다
2. 문서에 없는 두 가지는 `제안` 으로: 투표 중에 범인이 나가 이미 낸 표가 있어도 판정 전이니 카드 3, 9 를 뺀다. 판 취소로 돌아온 대기실에서 나간 사람은 인원에서 뺀다
3. join_room(007)이 대기실에서도 `left_at` 을 지우고 있어 고치지 않는다
4. 6명 판이 취소된 뒤 나간 사람 줄이 자리를 차지해 새 사람이 못 들어오는 문제는 드문 경우라 받아들이고 남은 일로 둔다 (줄을 지우면 취소된 판 기록이 같이 지워져 D-019 와 부딪힘)

## 사용한 skill
- hatch MCP `read_doc`: 문서 판 번호 확인 (PRD 7, 기능명세 5, 데이터 4, 개발 프롬프트 6, 로드맵 4, 사본과 같음)
- worklog skill: 이 기록
- demo-record skill (로컬): 시크릿 창 5개 화면 확인, 스크린샷만
- 에이전트 test-pruner, comment-reviewer, ponytail-review: PR 전 목록만 받음

## 확인
- `npm run typecheck` → 통과
- `npm run lint` → 통과
- `npm test` → 130개 통과
- `npm run test:db` → 7파일 38개 통과 (로컬에 008 적용 뒤)
- 브라우저 (빌드 화면, 시크릿 창 5개 390×844, 로컬 Supabase, 닉네임 테스트1~5). 입구가 없어 범인 나가기는 서버에서 `leaveRoom` 을 부르는 임시 스크립트로 흉내 (커밋 안 함)
  - 범인이 secret 에서 나가기 → 5개 창 모두 대기실, 참가자 4/6. 범인이 코드로 다시 들어오면 대기실 5/6 으로 합류
  - 범인 아닌 1명이 r1 에서 나가기 → r2 로 넘어감. 투표 완료 분모는 0/3 (5명 - 나간 사람 - 유령). 나간 사람은 후보에 남음 (D-021)
  - 투표 중 1표가 있는 상태에서 범인 나가기 → 모두 해설, 카드 1 "방송 중단 / 범인 테스트3이 자리를 떠나 방송이 중단됐어요", 7장(투표 결과, 맞힌 사람, 맞춤 해설 없음). 범인이 다시 들어와도 해설 그대로
  - 다시 하기로 새 판 → r2 에서 범인 나가기 → 모두 해설, 같은 카드 1, 7장
  - DB: `ended_reason` cancelled, culprit_left 저장, `player_left` props 에 phase(r1, vote, r2) 확인
  - 못 본 것: intro 에서 나가기는 브라우저로 보지 않음(단위 테스트만), 360/430px 폭

## 남은 일
- 원격 Supabase 에 008 적용 (머지 뒤)
- 나간 상태가 되는 입구(게임 중 나가기 화면, 연결 끊김 감지): PO 확인 뒤
- 판 취소 뒤 대기실에서 나간 범인 본인 폰에는 (나) 표시 없는 대기실이 보인다. 입구가 정해지면 나가는 폰은 홈으로 가므로 그때 맞춘다
- 나간 사람(유령 아님)이 투표 화면을 보면 "유령은 투표하지 않아요"가 나온다. 지금은 게임 중에 나간 상태가 되는 길이 없어 실제로는 생기지 않음. 나간 사람이 무엇을 볼지는 입구가 정해질 때 함께 정함
- 6명 판이 취소된 뒤 나간 사람(left_at)이 자리를 계속 차지해 새 사람이 못 들어온다. 드문 경우라 받아들임. 필요하면 자리 구조를 바꾸는 이슈로
- 판 취소 뒤 대기실에서 나가기는 지금처럼 플레이어를 지워서, 취소된 판의 그 사람 배정 기록도 같이 지워진다(외래 키 cascade)

## 사용량
`node scripts/usage.mjs --md` 로 만든 값 (2026-11-26). 비용은 정가 기준 추정, 사용률 %는 계정 전체 값이라 다른 작업도 섞인다

| 항목 | 값 |
| --- | --- |
| 비용 | 모름 (비용 기록 없음) (세션 1개) |
| 토큰 | 입력 216 · 출력 55.7k · 캐시 쓰기 240.7k · 캐시 읽기 16.1M |
| 메시지 | 103 (메인 92, 서브에이전트 11) |
| 모델 | claude-opus-5-5 103 |
| 사용률 | 5시간 32% → 3% · 주간 38% → 39% |
| 많이 쓴 도구 | Bash 89, Read 20, SubagentHandback 3, Agent 3, ToolSearch 1, mcp__hatch__read_doc 1, Skill 1 |
| skill | worklog 1 |
| 에이전트 | test-pruner 1, comment-reviewer 1, ponytail-review 1 |

<!-- usage {"branch":"uyeon0/feat-72-culprit-leave","issue":72,"sessions":1,"messages":103,"first":"2026-11-26","last":"2026-11-26","tokens":{"input":216,"output":55676,"cacheWrite":240710,"cacheRead":16127944},"costUSD":null,"where":{"main":{"messages":92,"output":48009},"subagent":{"messages":11,"output":7667}},"models":{"claude-opus-5-5":{"messages":103,"output":55676}},"tools":{"Bash":89,"SubagentHandback":3,"ToolSearch":1,"mcp__hatch__read_doc":1,"Skill":1,"Read":20,"Agent":3},"skills":{"worklog":1},"agents":{"test-pruner":1,"comment-reviewer":1,"ponytail-review":1},"rate":{"five_hour":{"from":32,"to":3},"seven_day":{"from":38,"to":39}}} -->
